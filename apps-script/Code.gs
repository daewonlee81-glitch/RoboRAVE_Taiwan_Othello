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
            'red_warn', 'blue_warn', 'winner', 'method', 'status', 'arena', 'updated'];
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
const settings = () => ({ reg_open: props().getProperty('REG_OPEN') !== '0' });
const publicP = p => ({ id: p.id, name: p.name, nationality: p.nationality, nat_name: p.nat_name, division: p.division, status: p.status });

function state(admin) {
  const P = rows(SH.P, PH);
  return {
    ok: true, settings: settings(),
    participants: admin ? P : P.filter(p => p.status !== 'withdrawn').map(publicP),
    draws: rows(SH.D, DH), matches: rows(SH.M, MH), at: new Date().toISOString()
  };
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
  const n = P.reduce((m, p) => Math.max(m, parseInt(String(p.id).replace(/\D/g, ''), 10) || 0), 0) + 1;
  const id = 'RT-' + ('000' + n).slice(-4);
  const row = { id, created: new Date().toISOString(), name, dob, nationality: nat, nat_name: clean(b.nat_name, 60),
                division, status: 'registered', note: '', lang: clean(b.lang, 5) };
  sheet(SH.P).appendRow(PH.map(h => row[h]));
  return { ok: true, id, name, division };
}

function admin(b) {
  switch (b.op) {
    case 'state': return state(true);
    case 'participant': { // add or edit
      const p = b.p || {};
      if (!p.id) {
        const P = rows(SH.P, PH);
        const n = P.reduce((m, x) => Math.max(m, parseInt(String(x.id).replace(/\D/g, ''), 10) || 0), 0) + 1;
        p.id = 'RT-' + ('000' + n).slice(-4); p.created = new Date().toISOString(); p.status = p.status || 'registered';
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
    case 'settings': {
      if (b.reg_open != null) props().setProperty('REG_OPEN', b.reg_open ? '1' : '0');
      return state(true);
    }
  }
  return { ok: false, error: 'unknown_op' };
}
