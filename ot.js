/* ot.js — shared code for the Othello registration / bracket / operations pages
 *   OT.t()        translations (English · 繁體中文 · 한국어)
 *   OT.api        Apps Script client, or a localStorage demo backend when API_URL is empty
 *   OT.draw…      group league + knockout generation, standings, bracket progression
 *   OT.render…    bracket / standings HTML shared by the public page and the operations page
 */
(function () {
  'use strict';
  const C = window.OT_CONFIG || {};
  const OT = window.OT = { C };

  /* ===================== language ===================== */
  const LANGS = [['en', 'English'], ['zh', '繁體中文'], ['ko', '한국어']];
  const q = new URLSearchParams(location.search);
  let lang = (q.get('lang') || '').toLowerCase();
  try { if (LANGS.some(l => l[0] === lang)) localStorage.setItem('ot.lang', lang); else lang = localStorage.getItem('ot.lang') || ''; } catch (e) {}
  if (!LANGS.some(l => l[0] === lang)) { const n = (navigator.language || 'en').toLowerCase(); lang = n.startsWith('zh') ? 'zh' : n.startsWith('ko') ? 'ko' : 'en'; }
  OT.lang = lang; OT.LANGS = LANGS;
  OT.setLang = l => { try { localStorage.setItem('ot.lang', l); } catch (e) {} const u = new URL(location.href); u.searchParams.set('lang', l); location.href = u.toString(); };

  // key = English text; value = [繁中, 한국어]
  const TR = {
    'Robot Battle Othello': ['機器人對戰黑白棋', '로봇배틀 오셀로'],
    'Registration': ['報名', '참가 신청'],
    'Bracket': ['賽程表', '대진표'],
    'Operations': ['賽事營運', '경기 운영'],
    'Full name (English)': ['英文姓名', '이름 (영문)'],
    'As on your passport, e.g. WANG XIAOMING': ['請與護照相同，例：WANG XIAOMING', '여권과 같은 영문 이름, 예: HONG GILDONG'],
    'Date of birth': ['出生日期', '생년월일'],
    'Nationality': ['國籍', '국적'],
    'Select…': ['請選擇…', '선택…'],
    'Other': ['其他', '기타'],
    'Country name': ['國家名稱', '국가 이름'],
    'Division': ['組別', '부문'],
    'Junior — elementary school': ['少年組 — 國小', '주니어 — 초등부'],
    'Senior — middle / high school': ['青年組 — 國中、高中', '시니어 — 중·고등부'],
    'Junior': ['少年組', '주니어'],
    'Senior': ['青年組', '시니어'],
    'I agree that my name, date of birth and nationality are collected to run this competition. Only name and nationality appear on the public bracket.':
      ['我同意為辦理本賽事蒐集我的姓名、出生日期與國籍。公開賽程表只顯示姓名與國籍。', '대회 운영을 위해 이름, 생년월일, 국적을 수집하는 데 동의합니다. 공개 대진표에는 이름과 국적만 표시됩니다.'],
    'Register': ['送出報名', '신청하기'],
    'Sending…': ['傳送中…', '보내는 중…'],
    'Registration complete': ['報名完成', '신청 완료'],
    'Your registration number': ['您的報名編號', '신청 번호'],
    'Keep this number for check-in on the competition day.': ['比賽當天報到時請出示此編號。', '대회 당일 등록할 때 이 번호를 알려 주세요.'],
    'Register another participant': ['再報名一位', '다른 참가자 신청'],
    'Please enter the name in English letters.': ['請以英文字母填寫姓名。', '이름을 영문으로 입력해 주세요.'],
    'Please enter a valid date of birth.': ['請輸入正確的出生日期。', '생년월일을 올바르게 입력해 주세요.'],
    'Please choose a nationality.': ['請選擇國籍。', '국적을 선택해 주세요.'],
    'Please choose a division.': ['請選擇組別。', '부문을 선택해 주세요.'],
    'Please agree to the data collection.': ['請勾選同意蒐集資料。', '정보 수집에 동의해 주세요.'],
    'This participant is already registered.': ['此參賽者已報名。', '이미 신청한 참가자입니다.'],
    'Registration is closed.': ['報名已截止。', '신청이 마감되었습니다.'],
    'Could not send. Please try again.': ['傳送失敗，請再試一次。', '보내지 못했습니다. 다시 시도해 주세요.'],
    'Demo mode — data is saved only in this browser.': ['示範模式 — 資料只存在這個瀏覽器。', '데모 모드 — 이 브라우저에만 저장됩니다.'],
    'Registered': ['已報名', '신청 인원'],
    'Rules': ['規則', '규정'],
    'Practice simulator': ['練習模擬器', '연습 시뮬레이터'],
    'Matches are 2 minutes. Depending on the number of participants, the event runs as a group league followed by a knockout, or as a knockout from the start.':
      ['每場比賽 2 分鐘。依參賽人數採分組循環賽加淘汰賽，或直接進行淘汰賽。', '모든 경기는 2분입니다. 참가 인원에 따라 조별리그 후 녹아웃 토너먼트 또는 처음부터 토너먼트로 진행합니다.'],
    'Group': ['組', '조'],
    'Knockout': ['淘汰賽', '토너먼트'],
    'Final': ['決賽', '결승'],
    'Semifinal': ['準決賽', '준결승'],
    'Quarterfinal': ['八強賽', '8강'],
    'Round of 16': ['十六強賽', '16강'],
    'Round of 32': ['三十二強賽', '32강'],
    '3rd place': ['季軍賽', '3·4위 결정전'],
    'Round': ['輪', '라운드'],
    'Player': ['選手', '선수'],
    'P': ['場', '경기'], 'W': ['勝', '승'], 'D': ['和', '무'], 'L': ['敗', '패'], 'Pts': ['積分', '승점'],
    '+/-': ['得失', '득실'],
    'Not drawn yet': ['尚未抽籤', '아직 대진 전'],
    'Waiting for players': ['等待選手', '대기 중'],
    'bye': ['輪空', '부전승'],
    'Winner': ['冠軍', '우승'],
    'Runner-up': ['亞軍', '준우승'],
    'Final standings': ['最終名次', '최종 순위'],
    'Auto-refresh every 20 s': ['每 20 秒自動更新', '20초마다 자동 새로 고침'],
    'Last update': ['最後更新', '마지막 갱신'],
    'live': ['進行中', '진행 중'],
    'Group stage': ['分組循環賽', '조별리그'],
    'Advancing': ['晉級', '진출'],
    'Called game': ['提前結束', '콜드게임'],
    'Golden point': ['黃金得分', '골든포인트'],
    'Decision': ['判定', '판정'],
    'Disqualification': ['失格', '실격'],
    'Forfeit': ['棄權', '기권'],
    'The bracket will be published on the competition day.': ['賽程表將於比賽當天公布。', '대진표는 경기 당일 공개됩니다.'],
    'Competition day': ['比賽日', '경기일'],
    'Only registered participants can view the bracket. Enter your registration number and date of birth.': ['只有已報名的參賽者可以查看賽程表。請輸入報名編號與出生日期。', '대진표는 참가자만 볼 수 있습니다. 신청 번호와 생년월일을 입력하세요.'],
    'Registration number': ['報名編號', '신청 번호'],
    'View bracket': ['查看賽程表', '대진표 보기'],
    'No registration matches this number and date of birth.': ['找不到符合此編號與出生日期的報名資料。', '신청 번호와 생년월일이 맞는 신청이 없습니다.'],
    'Signed in as': ['目前登入', '확인된 참가자'],
    'Sign out': ['登出', '나가기'],
    'Participants': ['參賽名單', '참가자 명단'],
    'Only registered participants can view the participant list. Enter your registration number and date of birth.': ['只有已報名的參賽者可以查看參賽名單。請輸入報名編號與出生日期。', '참가자 명단은 참가자만 볼 수 있습니다. 신청 번호와 생년월일을 입력하세요.'],
    'View participants': ['查看參賽名單', '명단 보기'],
    'Name': ['姓名', '이름'],
    'Status': ['狀態', '상태'],
    'registered': ['已報名', '신청'],
    'checked-in': ['已報到', '출석'],
    'Total': ['合計', '합계'],
    'No participants yet.': ['目前尚無參賽者。', '아직 참가자가 없습니다.'],
    'Your name is highlighted. If anything is wrong, contact the organizer.': ['您的名字以醒目標示。如資料有誤，請聯絡主辦單位。', '내 이름은 강조 표시됩니다. 정보가 틀리면 주최 측에 알려 주세요.'],
  };
  OT.t = (s, ...a) => { const r = lang === 'en' ? s : ((TR[s] || [])[lang === 'zh' ? 0 : 1] || s); return a.length ? r.replace(/\{(\d)\}/g, (_, i) => a[i]) : r; };
  OT.applyI18n = root => (root || document).querySelectorAll('[data-t]').forEach(e => { e.textContent = OT.t(e.dataset.t); });
  OT.langSwitch = el => { el.innerHTML = LANGS.map(([k, n]) => `<button type="button" class="${k === lang ? 'on' : ''}" data-l="${k}">${n}</button>`).join(''); el.onclick = e => { const b = e.target.closest('[data-l]'); if (b) OT.setLang(b.dataset.l); }; };
  OT.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));


  /* ===================== page header ===================== */
  OT.header = (active, opts) => {
    const el = document.querySelector('header.top'); if (!el) return;
    const nav = [['index.html', 'Registration'], ['participants.html', 'Participants'], ['bracket.html', 'Bracket']].concat(opts && opts.admin ? [['admin.html', 'Operations']] : []);
    el.innerHTML = `<div class="in"><a class="brand" href="index.html" style="text-decoration:none;color:inherit"><img class="logo" src="logo.png" alt="RoboRAVE Taiwan Open" onerror="this.style.display='none'"><div class="tx"><b>${OT.esc(C.EVENT || 'RoboRAVE Taiwan Open')}</b><span>${OT.esc(OT.t('Robot Battle Othello'))}${C.DATE ? ' · ' + OT.esc(C.DATE) : ''}</span></div></a>` +
      `<nav class="tabs">${nav.map(([h, k]) => `<a href="${h}" class="${k === active ? 'on' : ''}">${OT.esc(OT.t(k))}</a>`).join('')}</nav><div class="langs"></div></div>`;
    OT.langSwitch(el.querySelector('.langs'));
    document.title = OT.t(active) + ' · ' + OT.t('Robot Battle Othello') + ' · ' + (C.EVENT || '');
  };

  /* ===================== countries ===================== */
  const CODES = ['TW', 'KR', 'JP', 'CN', 'HK', 'MO', 'TH', 'MY', 'SG', 'PH', 'ID', 'VN', 'IN', 'MN', 'KZ', 'UZ', 'AU', 'NZ', 'US', 'CA', 'MX', 'BR', 'GB', 'DE', 'FR', 'ES', 'IT', 'GR', 'NL', 'TR', 'AE', 'SA', 'EG', 'ZA', 'NG', 'KE'];
  const dn = (() => { try { return new Intl.DisplayNames([lang === 'zh' ? 'zh-Hant-TW' : lang === 'ko' ? 'ko' : 'en'], { type: 'region' }); } catch (e) { return null; } })();
  const dnEn = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { return null; } })();
  OT.countryName = (c, en) => { if (!c || c === 'OTHER') return ''; const d = en ? dnEn : dn; try { return (d && d.of(c)) || c; } catch (e) { return c; } };
  OT.flag = c => /^[A-Z]{2}$/.test(c || '') ? String.fromCodePoint(...[...c].map(x => 0x1f1a5 + x.charCodeAt(0))) : '🏳️';
  OT.countries = () => CODES.map(c => [c, OT.countryName(c)]).sort((a, b) => a[1].localeCompare(b[1], lang));
  OT.natLabel = p => p.nationality === 'OTHER' ? (p.nat_name || OT.t('Other')) : OT.countryName(p.nationality);

  /* ===================== API ===================== */
  OT.demo = !C.API_URL;
  const DKEY = 'ot.demo.v1';
  const dget = () => { try { return JSON.parse(localStorage.getItem(DKEY)) || null; } catch (e) { return null; } };
  const dset = d => localStorage.setItem(DKEY, JSON.stringify(d));
  const demo = () => dget() || { participants: [], draws: [], matches: [], settings: { reg_open: true, bracket_public: false }, key: 'demo' };
  const nextId = P => 'RT-' + String(P.reduce((m, p) => Math.max(m, parseInt(String(p.id).replace(/\D/g, ''), 10) || 0), 0) + 1).padStart(4, '0');
  const publicP = p => ({ id: p.id, name: p.name, nationality: p.nationality, nat_name: p.nat_name, division: p.division, status: p.status });
  const demoState = (d, admin, me) => { const act = d.participants.filter(p => p.status !== 'withdrawn'), open = admin || (me && !!d.settings.bracket_public); return { ok: true, settings: d.settings, count: act.length, me: me || null, participants: admin ? d.participants : me ? act.map(publicP) : [], draws: open ? d.draws : [], matches: open ? d.matches : [], at: new Date().toISOString() }; };
  async function call(body) {
    if (OT.demo) return demoCall(body);
    const r = await fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }
  function demoCall(b) {
    const d = demo(), now = new Date().toISOString();
    if (b.action === 'register') {
      if (!d.settings.reg_open) return { ok: false, error: 'closed' };
      if (d.participants.some(p => p.name.toLowerCase() === b.name.toLowerCase() && p.dob === b.dob && p.status !== 'withdrawn')) return { ok: false, error: 'duplicate' };
      const p = { id: nextId(d.participants), created: now, name: b.name, dob: b.dob, nationality: b.nationality, nat_name: b.nat_name || '', division: b.division, status: 'registered', note: '', lang: b.lang || '' };
      d.participants.push(p); dset(d); return { ok: true, id: p.id, name: p.name, division: p.division };
    }
    if (b.action === 'view') {
      const p = d.participants.find(x => x.id.toUpperCase() === String(b.id || '').toUpperCase() && x.dob === b.dob && x.status !== 'withdrawn');
      return p ? demoState(d, false, { id: p.id, name: p.name, division: p.division, nationality: p.nationality }) : { ok: false, error: 'not_found' };
    }
    if (b.action !== 'admin') return { ok: false, error: 'unknown_action' };
    if (b.key !== d.key) return { ok: false, error: 'bad_key' };
    if (b.op === 'participant') {
      const p = Object.assign({}, b.p);
      if (!p.id) { p.id = nextId(d.participants); p.created = now; p.status = p.status || 'registered'; d.participants.push(p); }
      else { const i = d.participants.findIndex(x => x.id === p.id); if (i >= 0) d.participants[i] = Object.assign(d.participants[i], p); else d.participants.push(p); }
    } else if (b.op === 'delete') d.participants = d.participants.filter(p => p.id !== b.id);
    else if (b.op === 'draw') {
      d.draws = d.draws.filter(x => x.division !== b.division).concat(b.format ? [{ division: b.division, format: b.format, json: JSON.stringify(b.json || {}), updated: now }] : []);
      d.matches = d.matches.filter(m => m.division !== b.division).concat(b.matches || []);
    } else if (b.op === 'matches') {
      for (const r of b.rows || []) { const i = d.matches.findIndex(m => m.id === r.id); const o = Object.assign({}, r, { updated: now }); if (i >= 0) d.matches[i] = Object.assign(d.matches[i], o); else d.matches.push(o); }
    } else if (b.op === 'settings') { if (b.reg_open != null) d.settings.reg_open = !!b.reg_open; if (b.bracket_public != null) d.settings.bracket_public = !!b.bracket_public; }
    else if (b.op !== 'state') return { ok: false, error: 'unknown_op' };
    dset(d); return demoState(d, true);
  }
  OT.api = {
    async state() {
      if (OT.demo) return demoState(demo(), false);
      const r = await fetch(C.API_URL + (C.API_URL.includes('?') ? '&' : '?') + 'action=state&t=' + Date.now());
      return r.json();
    },
    register: data => call(Object.assign({ action: 'register' }, data)),
    view: (id, dob) => call({ action: 'view', id, dob }),
    admin: (key, op, data) => call(Object.assign({ action: 'admin', key, op }, data || {})),
  };

  /* ===================== draw / bracket logic ===================== */
  const num = v => (v === '' || v == null || isNaN(+v)) ? null : +v;
  OT.num = num;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const GL = 'ABCDEFGHIJKLMNOP';
  OT.GL = GL;

  // suggested format from the number of players
  OT.suggest = n => n >= 8 ? { format: 'groups', groups: Math.max(2, Math.round(n / 4)), adv: 2 } : { format: 'knockout', groups: 0, adv: 0 };

  // spread players with the same nationality across groups (snake deal)
  function dealGroups(players, g) {
    const by = new Map();
    for (const p of shuffle(players)) { const k = p.nationality === 'OTHER' ? 'OTHER:' + (p.nat_name || '') : p.nationality; if (!by.has(k)) by.set(k, []); by.get(k).push(p); }
    const order = [...by.values()].sort((a, b) => b.length - a.length).flat();
    const G = Array.from({ length: g }, () => []);
    order.forEach((p, i) => { const r = Math.floor(i / g), c = i % g; G[r % 2 ? g - 1 - c : c].push(p.id); });
    return G;
  }
  // round robin (circle method) → [[a,b],…] per round
  function roundRobin(ids) {
    const a = ids.slice(); if (a.length % 2) a.push(null);
    const n = a.length, R = [];
    for (let r = 0; r < n - 1; r++) {
      const ms = [];
      for (let i = 0; i < n / 2; i++) { const x = a[i], y = a[n - 1 - i]; if (x && y) ms.push(r % 2 ? [y, x] : [x, y]); }
      R.push(ms); a.splice(1, 0, a.pop());
    }
    return R;
  }
  const seedOrder = size => { let o = [1, 2]; while (o.length < size) { const m = o.length * 2 + 1; o = o.flatMap(s => [s, m - s]); } return o; };
  const pow2 = n => { let s = 2; while (s < n) s *= 2; return s; };
  OT.roundName = (r, R) => { const left = R - r; return left === 0 ? OT.t('Final') : left === 1 ? OT.t('Semifinal') : left === 2 ? OT.t('Quarterfinal') : left === 3 ? OT.t('Round of 16') : left === 4 ? OT.t('Round of 32') : OT.t('Round') + ' ' + r; };

  // knockout rows from a list of slot sources (player id, '@A1' group placeholder, or '' for a bye)
  function knockoutRows(div, sources) {
    const size = pow2(sources.length), ord = seedOrder(size), R = Math.log2(size), rows = [];
    const src = i => sources[ord[i] - 1] || '';
    for (let r = 1; r <= R; r++) {
      const n = size >> r;
      for (let i = 0; i < n; i++) rows.push(mrow(div, 'K', '', r, i + 1, r === 1 ? src(2 * i) : '', r === 1 ? src(2 * i + 1) : ''));
    }
    if (size >= 4) rows.push(mrow(div, 'K', '3P', R, 1, '', ''));
    const first = Array.from({ length: size / 2 }, (_, i) => [src(2 * i), src(2 * i + 1)]);
    return { rows, size, rounds: R, first };
  }
  const mrow = (div, stage, grp, round, slot, red, blue) => ({
    id: stage === 'K' && grp === '3P' ? `${div}-K3P` : `${div}-${stage}${grp}-${round}-${slot}`,
    division: div, stage, grp, round, slot, red, blue, red_score: '', blue_score: '', red_warn: '', blue_warn: '',
    winner: '', method: '', status: 'pending', arena: '', updated: ''
  });

  // build a whole draw for a division
  OT.makeDraw = (div, players, opt) => {
    const P = players.filter(p => p.division === div && p.status !== 'withdrawn');
    if (P.length < 2) throw new Error('need 2+ players');
    if (opt.format === 'groups') {
      const g = Math.max(2, Math.min(opt.groups || 2, Math.floor(P.length / 2))), adv = Math.max(1, Math.min(opt.adv || 2, 4));
      const groups = dealGroups(P, g), matches = [];
      groups.forEach((ids, gi) => roundRobin(ids).forEach((ms, ri) => ms.forEach(([a, b], k) => matches.push(mrow(div, 'G', GL[gi], ri + 1, k + 1, a, b)))));
      // knockout from group places: winners first, then runners-up etc. — reorder lower places to avoid same-group first-round pairs
      const tiers = Array.from({ length: adv }, (_, k) => groups.map((_, gi) => '@' + GL[gi] + (k + 1)));
      let sources = tiers.flat();
      const size = pow2(sources.length), ord = seedOrder(size);
      const clash = s => { let c = 0; for (let i = 0; i < size; i += 2) { const a = s[ord[i] - 1], b = s[ord[i + 1] - 1]; if (a && b && a[1] === b[1]) c++; } return c; };
      if (clash(sources)) {
        for (let t = 0; t < 400 && clash(sources); t++) sources = tiers[0].concat(tiers.slice(1).flatMap(x => shuffle(x)));
      }
      const ko = knockoutRows(div, sources);
      return { format: 'groups', json: { groups, adv, size: ko.size, rounds: ko.rounds, first: ko.first }, matches: matches.concat(ko.rows) };
    }
    const ids = shuffle(P).map(p => p.id);
    const ko = knockoutRows(div, ids);
    return { format: 'knockout', json: { size: ko.size, rounds: ko.rounds, first: ko.first }, matches: ko.rows };
  };

  // group standings
  OT.standings = (ids, matches) => {
    const S = new Map(ids.map(id => [id, { id, p: 0, w: 0, d: 0, l: 0, pts: 0, bf: 0, ba: 0, warn: 0, dq: 0 }]));
    for (const m of matches) {
      if (m.status !== 'done' || !S.has(m.red) || !S.has(m.blue)) continue;
      const a = S.get(m.red), b = S.get(m.blue), rs = num(m.red_score) || 0, bs = num(m.blue_score) || 0;
      a.p++; b.p++; a.bf += rs; a.ba += bs; b.bf += bs; b.ba += rs; a.warn += num(m.red_warn) || 0; b.warn += num(m.blue_warn) || 0;
      if (m.winner === m.red) { a.w++; b.l++; a.pts += 3; } else if (m.winner === m.blue) { b.w++; a.l++; b.pts += 3; } else { a.d++; b.d++; a.pts++; b.pts++; }
    }
    const h2h = (x, y) => { const m = matches.find(m => m.status === 'done' && ((m.red === x.id && m.blue === y.id) || (m.red === y.id && m.blue === x.id))); return !m || !m.winner ? 0 : m.winner === x.id ? -1 : 1; };
    return [...S.values()].sort((x, y) => y.pts - x.pts || (y.bf - y.ba) - (x.bf - x.ba) || y.bf - x.bf || x.warn - y.warn || h2h(x, y) || String(x.id).localeCompare(String(y.id)));
  };

  // recompute knockout slots (group places, winners, byes). Returns rows that changed.
  OT.propagate = (div, draw, all) => {
    if (!draw) return [];
    const J = typeof draw.json === 'string' ? JSON.parse(draw.json || '{}') : (draw.json || {});
    const M = all.filter(m => m.division === div), byId = new Map(M.map(m => [m.id, m])), changed = new Map();
    const set = (m, k, v) => { v = v == null ? '' : String(v); if (String(m[k] == null ? '' : m[k]) !== v) { m[k] = v; changed.set(m.id, m); } };
    // group places
    const place = {};
    if (draw.format === 'groups') (J.groups || []).forEach((ids, gi) => {
      const gm = M.filter(m => m.stage === 'G' && m.grp === GL[gi]);
      if (gm.length && gm.every(m => m.status === 'done')) OT.standings(ids, gm).forEach((s, k) => { place['@' + GL[gi] + (k + 1)] = s.id; });
    });
    const R = J.rounds || 1, KO = r => M.filter(m => m.stage === 'K' && m.grp !== '3P' && +m.round === r).sort((a, b) => a.slot - b.slot);
    const loser = m => m.status === 'done' && m.winner ? (m.winner === m.red ? m.blue : m.red) : '';
    const reset = m => { for (const k of ['red_score', 'blue_score', 'red_warn', 'blue_warn', 'winner', 'method']) set(m, k, ''); set(m, 'status', 'pending'); };
    const first = J.first || [];
    const isPh = v => String(v || '').startsWith('@');
    for (let r = 1; r <= R; r++) {
      KO(r).forEach(m => {
        let red = '', blue = '', waiting = false;
        if (r === 1) {
          const sr = first[m.slot - 1] || [m.red, m.blue];
          red = isPh(sr[0]) ? (place[sr[0]] || sr[0]) : (sr[0] || '');
          blue = isPh(sr[1]) ? (place[sr[1]] || sr[1]) : (sr[1] || '');
          waiting = isPh(red) || isPh(blue);
        } else {
          const f = KO(r - 1), a = f[2 * (m.slot - 1)], b = f[2 * (m.slot - 1) + 1];
          waiting = !!((a && a.status !== 'done') || (b && b.status !== 'done'));
          red = a && a.status === 'done' ? (a.winner || '') : '';
          blue = b && b.status === 'done' ? (b.winner || '') : '';
        }
        if (String(m.red || '') !== red || String(m.blue || '') !== blue) { if (m.status === 'done') reset(m); set(m, 'red', red); set(m, 'blue', blue); }
        if (waiting) { if (m.method === 'bye') reset(m); return; }
        if (!red || !blue) { // bye (one or both empty)
          set(m, 'winner', red || blue); set(m, 'method', 'bye'); set(m, 'status', 'done'); set(m, 'red_score', ''); set(m, 'blue_score', '');
        } else if (m.method === 'bye') reset(m);
      });
    }
    const third = byId.get(`${div}-K3P`);
    if (third) {
      const semis = KO(R - 1);
      const lr = semis[0] ? loser(semis[0]) : '', lb = semis[1] ? loser(semis[1]) : '';
      const ready = semis.length === 2 && semis.every(m => m.status === 'done');
      const red = ready ? lr : '', blue = ready ? lb : '';
      if (String(third.red) !== red || String(third.blue) !== blue) { if (third.status === 'done') reset(third); set(third, 'red', red); set(third, 'blue', blue); }
      if (ready && (!!red ^ !!blue)) { set(third, 'winner', red || blue); set(third, 'method', 'bye'); set(third, 'status', 'done'); }
    }
    return [...changed.values()];
  };

  // final placings for a division (when the knockout is finished)
  OT.podium = (div, draw, M) => {
    if (!draw) return null;
    const J = typeof draw.json === 'string' ? JSON.parse(draw.json || '{}') : draw.json, R = J.rounds;
    const fin = M.find(m => m.division === div && m.stage === 'K' && m.grp !== '3P' && +m.round === R);
    if (!fin || fin.status !== 'done' || !fin.winner) return null;
    const third = M.find(m => m.id === `${div}-K3P`);
    const lost = m => m.winner === m.red ? m.blue : m.red;
    return { first: fin.winner, second: lost(fin), third: third && third.status === 'done' ? third.winner : '', fourth: third && third.status === 'done' && third.winner ? lost(third) : '' };
  };

  /* ===================== rendering ===================== */
  OT.nameOf = (id, P) => {
    if (!id) return '';
    if (String(id).startsWith('@')) return `<span class="ph">${OT.esc(OT.t('Group'))} ${OT.esc(id.slice(1, 2))} #${OT.esc(id.slice(2))}</span>`;
    const p = P.get(id); return p ? `${OT.flag(p.nationality)} ${OT.esc(p.name)}` : OT.esc(id);
  };
  const methodLabel = m => ({ called: OT.t('Called game'), golden: OT.t('Golden point'), decision: OT.t('Decision'), dq: OT.t('Disqualification'), forfeit: OT.t('Forfeit'), bye: OT.t('bye') }[m] || '');
  OT.methodLabel = methodLabel;

  OT.renderStandingsTable = (ids, gm, P, adv) => {
    const st = OT.standings(ids, gm);
    return `<table class="st"><thead><tr><th>#</th><th class="l">${OT.t('Player')}</th><th>${OT.t('P')}</th><th>${OT.t('W')}</th><th>${OT.t('D')}</th><th>${OT.t('L')}</th><th>${OT.t('+/-')}</th><th>${OT.t('Pts')}</th></tr></thead><tbody>` +
      st.map((s, k) => `<tr class="${k < adv ? 'adv' : ''}"><td>${k + 1}</td><td class="l">${OT.nameOf(s.id, P)}</td><td>${s.p}</td><td>${s.w}</td><td>${s.d}</td><td>${s.l}</td><td>${s.bf - s.ba > 0 ? '+' : ''}${s.bf - s.ba}</td><td><b>${s.pts}</b></td></tr>`).join('') + '</tbody></table>';
  };
  OT.matchLine = (m, P, opts) => {
    const done = m.status === 'done', rs = num(m.red_score), bs = num(m.blue_score);
    const side = (id, sc, col) => `<div class="side ${col}${done && m.winner && m.winner === id ? ' win' : ''}${!id ? ' empty' : ''}"><span class="nm">${id ? OT.nameOf(id, P) : (m.method === 'bye' ? OT.t('bye') : '—')}</span><span class="sc">${done && sc != null ? sc : ''}</span></div>`;
    const tag = m.status === 'live' ? `<span class="live">● ${OT.t('live')}</span>` : (done && m.method && m.method !== 'points') ? `<span class="meth">${OT.esc(methodLabel(m.method))}</span>` : '';
    return `<div class="match${m.status === 'live' ? ' is-live' : ''}${opts && opts.click ? ' clickable' : ''}" data-id="${OT.esc(m.id)}">${side(m.red, rs, 'red')}${side(m.blue, bs, 'blue')}${tag}</div>`;
  };
  OT.renderDivision = (div, state, opts) => {
    const P = new Map(state.participants.map(p => [p.id, p])), draw = state.draws.find(d => d.division === div);
    const M = state.matches.filter(m => m.division === div);
    if (!draw) return `<p class="muted">${OT.t('Not drawn yet')}</p>`;
    const J = typeof draw.json === 'string' ? JSON.parse(draw.json || '{}') : draw.json;
    let h = '';
    const pod = OT.podium(div, draw, state.matches);
    if (pod) h += `<div class="podium"><h3>${OT.t('Final standings')}</h3><ol>` + [pod.first, pod.second, pod.third, pod.fourth].filter(Boolean).map((id, k) => `<li class="p${k + 1}">${['🥇', '🥈', '🥉', '4'][k]} ${OT.nameOf(id, P)}</li>`).join('') + '</ol></div>';
    if (draw.format === 'groups') {
      h += `<h3>${OT.t('Group stage')}</h3><div class="groups">`;
      (J.groups || []).forEach((ids, gi) => {
        const gm = M.filter(m => m.stage === 'G' && m.grp === GL[gi]).sort((a, b) => a.round - b.round || a.slot - b.slot);
        h += `<section class="group"><h4>${OT.t('Group')} ${GL[gi]}</h4>${OT.renderStandingsTable(ids, gm, P, J.adv)}<div class="gm">${gm.map(m => OT.matchLine(m, P, opts)).join('')}</div></section>`;
      });
      h += '</div>';
    }
    const R = J.rounds || 1;
    h += `<h3>${OT.t('Knockout')}</h3><div class="bracket">`;
    for (let r = 1; r <= R; r++) {
      const ms = M.filter(m => m.stage === 'K' && m.grp !== '3P' && +m.round === r).sort((a, b) => a.slot - b.slot);
      h += `<div class="col"><div class="rn">${OT.roundName(r, R)}</div><div class="ms">${ms.map(m => OT.matchLine(m, P, opts)).join('')}</div></div>`;
    }
    h += '</div>';
    const third = M.find(m => m.id === `${div}-K3P`);
    if (third) h += `<div class="third"><div class="rn">${OT.t('3rd place')}</div>${OT.matchLine(third, P, opts)}</div>`;
    return h;
  };
})();
