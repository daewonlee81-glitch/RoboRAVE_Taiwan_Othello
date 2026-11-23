/**
 * RoboRAVE Taiwan Open 2026 · Robot Battle Othello — registration + bracket backend
 * Google Apps Script bound to a Google Sheet.
 *
 * Setup (once):
 *   1. Create a Google Sheet → Extensions → Apps Script → paste this file as Code.gs → Save.
 *   2. Run `setup` once (authorize). It creates the sheets and an admin key (shown in the log
 *      and stored in Project Settings → Script properties → ADMIN_KEY; change it there if you like).
 *   3. Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone → Deploy.
 *   4. Copy the Web app URL (…/exec) into othello/config.js (API_URL).
 *   After editing this code: Deploy → Manage deployments → Edit → Version: New version → Deploy
 *   (the URL stays the same).
 */

const SH = { P: 'Participants', M: 'Matches', D: 'Draws' };
const PH = ['id', 'created', 'name', 'dob', 'nationality', 'nat_name', 'division', 'status', 'note', 'lang'];
const MH = ['id', 'division', 'stage', 'grp', 'round', 'slot', 'red', 'blue', 'red_score', 'blue_score',
            'red_warn', 'blue_warn', 'winner', 'method', 'status', 'arena', 'updated', 'time'];
const DH = ['division', 'format', 'json', 'updated'];
const DIVS = ['junior', 'senior'];

function setup() {
  const ss = SpreadsheetApp.getActive();
  [[SH.P, PH], [SH.M, MH], [SH.D, DH]].forEach(([n, h]) => {
    let s = ss.getSheetByName(n);
    if (!s) s = ss.insertSheet(n);
    s.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold');
    s.setFrozenRows(1);
  });
  // dates and ids as plain text so Sheets does not reformat them
  ss.getSheetByName(SH.P).getRange('A:D').setNumberFormat('@');
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_KEY')) props.setProperty('ADMIN_KEY', Utilities.getUuid().slice(0, 8));
  if (!props.getProperty('REG_OPEN')) props.setProperty('REG_OPEN', '1');
  if (!props.getProperty('BRACKET_PUBLIC')) props.setProperty('BRACKET_PUBLIC', '0');
  Logger.log('ADMIN_KEY = ' + props.getProperty('ADMIN_KEY'));
}

/* ---------- helpers ---------- */
const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const sheet = n => SpreadsheetApp.getActive().getSheetByName(n);
function rows(n, head) {
  const s = sheet(n), last = s.getLastRow();
  if (last < 2) return [];
  return s.getRange(2, 1, last - 1, head.length).getDisplayValues()
    .filter(r => r[0] !== '')
    .map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
function writeAll(n, head, list) {
  const s = sheet(n), last = s.getLastRow();
  if (last >= 2) s.getRange(2, 1, last - 1, head.length).clearContent();
  if (list.length) s.getRange(2, 1, list.length, head.length).setValues(list.map(o => head.map(h => o[h] == null ? '' : String(o[h]))));
}
function upsert(n, head, list) {
  const cur = rows(n, head), idx = new Map(cur.map((r, i) => [r[head[0]], i]));
  for (const o of list) {
    const k = o[head[0]];
    if (idx.has(k)) cur[idx.get(k)] = Object.assign(cur[idx.get(k)], o);
    else { idx.set(k, cur.length); cur.push(o); }
  }
  writeAll(n, head, cur);
}
const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max || 80);
const props = () => PropertiesService.getScriptProperties();
const isAdmin = k => !!k && k === props().getProperty('ADMIN_KEY');
const settings = () => ({ reg_open: props().getProperty('REG_OPEN') !== '0', bracket_public: props().getProperty('BRACKET_PUBLIC') === '1' });
// event timetable + match timetable settings (Script property SCHEDULE, JSON). Public.
function schedule() { try { return JSON.parse(props().getProperty('SCHEDULE') || 'null'); } catch (e) { return null; } }
function ensureMatchHeader() { // adds columns added after the first setup (e.g. 'time')
  const s = sheet(SH.M);
  if (String(s.getRange(1, MH.length).getValue()) !== MH[MH.length - 1]) s.getRange(1, 1, 1, MH.length).setValues([MH]).setFontWeight('bold');
}
const publicP = p => ({ id: p.id, name: p.name, nationality: p.nationality, nat_name: p.nat_name, division: p.division, status: p.status });

// Public (no login): settings, the event timetable and the number of registrations.
// Participants (registration number + date of birth): the participant list (no dates of birth) at any time,
//   and the bracket once it is published on the competition day.
// Admin: everything.
function state(admin, me) {
  const P = rows(SH.P, PH), st = settings(), active = P.filter(p => p.status !== 'withdrawn');
  const open = admin || (me && st.bracket_public);
  return {
    ok: true, settings: st, schedule: schedule(), count: active.length, me: me || null,
    participants: admin ? P : me ? active.map(publicP) : [],
    draws: open ? rows(SH.D, DH) : [], matches: open ? rows(SH.M, MH) : [], at: new Date().toISOString()
  };
}
// Participant sign-in: the registered English name (case and spacing ignored) or the date of birth — either one is enough.
// If both are given, both must match. Several matches (e.g. the same date of birth) → all of them are "mine".
const normName = s => String(s == null ? '' : s).replace(/[^A-Za-z' -]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
// Registration numbers follow the RoboRAVE Taiwan Open Team IDs for this challenge: RO01, RO02, … (next = highest + 1)
const ID_PREFIX = 'RO';
const nextId = P => ID_PREFIX + String(P.reduce((m, p) => Math.max(m, parseInt(String(p.id).replace(/\D/g, ''), 10) || 0), 0) + 1).padStart(2, '0');
function view(b) {
  const id = clean(b.id, 10).toUpperCase(), name = normName(clean(b.name, 60)), dob = clean(b.dob, 10);
  if (!id && !name && !dob) return { ok: false, error: 'not_found' };
  const M = rows(SH.P, PH).filter(x => x.status !== 'withdrawn' && (!id || x.id.toUpperCase() === id) && (!name || normName(x.name) === name) && (!dob || x.dob === dob));
  if (!M.length) return { ok: false, error: 'not_found' };
  const p = M[0], r = state(false, { id: p.id, name: p.name, division: p.division, nationality: p.nationality });
  r.mine = M.map(x => x.id);
  return r;
}

/* ---------- web app ---------- */
function doGet(e) {
  const a = (e && e.parameter && e.parameter.action) || 'state';
  if (a === 'state') return out(state(false));
  return out({ ok: false, error: 'unknown_action' });
}

function doPost(e) {
  let b = {};
  try { b = JSON.parse(e.postData.contents || '{}'); } catch (err) { return out({ ok: false, error: 'bad_json' }); }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return out({ ok: false, error: 'busy' });
  try {
    if (b.action === 'register') return out(register(b));
    if (b.action === 'view') return out(view(b));
    if (b.action === 'admin') {
      if (!isAdmin(b.key)) return out({ ok: false, error: 'bad_key' });
      return out(admin(b));
    }
    return out({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return out({ ok: false, error: String(err && err.message || err) });
  } finally { lock.releaseLock(); }
}

function register(b) {
  if (!settings().reg_open) return { ok: false, error: 'closed' };
  const name = clean(b.name, 60).replace(/\s+/g, ' ');
  const dob = clean(b.dob, 10), nat = clean(b.nationality, 8).toUpperCase(), division = clean(b.division, 10);
  if (!/^[A-Za-z][A-Za-z .'\-]{1,59}$/.test(name)) return { ok: false, error: 'bad_name' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return { ok: false, error: 'bad_dob' };
  if (!/^[A-Z]{2}$|^OTHER$/.test(nat)) return { ok: false, error: 'bad_nationality' };
  if (DIVS.indexOf(division) < 0) return { ok: false, error: 'bad_division' };
  const P = rows(SH.P, PH);
  if (P.some(p => p.name.toLowerCase() === name.toLowerCase() && p.dob === dob && p.status !== 'withdrawn')) return { ok: false, error: 'duplicate' };
  const id = nextId(P);
  const row = { id, created: new Date().toISOString(), name, dob, nationality: nat, nat_name: clean(b.nat_name, 60),
                division, status: 'registered', note: '', lang: clean(b.lang, 5) };
  sheet(SH.P).appendRow(PH.map(h => row[h]));
  return { ok: true, id, name, division };
}

function admin(b) {
  ensureMatchHeader();
  switch (b.op) {
    case 'state': return state(true);
    case 'participant': { // add or edit
      const p = b.p || {};
      if (!p.id) {
        const P = rows(SH.P, PH);
        p.id = nextId(P); p.created = new Date().toISOString(); p.status = p.status || 'registered';
      }
      const o = {}; PH.forEach(h => { if (p[h] != null) o[h] = clean(p[h], h === 'note' ? 200 : 80); });
      upsert(SH.P, PH, [o]);
      return state(true);
    }
    case 'delete': {
      writeAll(SH.P, PH, rows(SH.P, PH).filter(p => p.id !== b.id));
      return state(true);
    }
    case 'draw': { // replace one division's draw and all its matches
      const div = clean(b.division, 10);
      if (DIVS.indexOf(div) < 0) return { ok: false, error: 'bad_division' };
      writeAll(SH.D, DH, rows(SH.D, DH).filter(d => d.division !== div)
        .concat(b.format ? [{ division: div, format: clean(b.format, 20), json: JSON.stringify(b.json || {}), updated: new Date().toISOString() }] : []));
      writeAll(SH.M, MH, rows(SH.M, MH).filter(m => m.division !== div).concat(b.matches || []));
      return state(true);
    }
    case 'matches': {
      const now = new Date().toISOString();
      upsert(SH.M, MH, (b.rows || []).map(r => Object.assign({}, r, { updated: now })));
      return state(true);
    }
    case 'schedule': {
      const hm = v => /^\d{1,2}:\d{2}$/.test(String(v || '')) ? String(v) : '';
      const items = (b.items || []).slice(0, 40).map(i => ({ start: hm(i.start), end: hm(i.end), ko: clean(i.ko, 80), en: clean(i.en, 80), zh: clean(i.zh, 80) }));
      const c = b.cfg || {};
      const cfg = { start: hm(c.start) || '13:00', slot: Math.max(1, Math.min(30, +c.slot || 5)), arenas: Math.max(1, Math.min(8, +c.arenas || 1)), finals: hm(c.finals) || '' };
      props().setProperty('SCHEDULE', JSON.stringify({ items, cfg, updated: new Date().toISOString() }));
      return state(true);
    }
    case 'settings': {
      if (b.reg_open != null) props().setProperty('REG_OPEN', b.reg_open ? '1' : '0');
      if (b.bracket_public != null) props().setProperty('BRACKET_PUBLIC', b.bracket_public ? '1' : '0');
      return state(true);
    }
  }
  return { ok: false, error: 'unknown_op' };
}
