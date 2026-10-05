/* PlayMath – app.js : menüler + oyun motoru
   Hazırlayan: Yıldıray Hoca · sanalnotum@gmail.com */
const GAMES = {};
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const css = (e, o) => { for (const k in o) k.startsWith('--') ? e.style.setProperty(k, o[k]) : (e.style[k] = o[k]); return e; };

const WORLDS = [
  { id: 'space', e: '🚀' }, { id: 'car', e: '🏎️' }, { id: 'plane', e: '✈️' }, { id: 'run', e: '🏃' }, { id: 'cat', e: '🐱' },
  { id: 'dog', e: '🐶' }, { id: 'bird', e: '🐦' }, { id: 'balloon', e: '🎈' }, { id: 'frog', e: '🐸' }, { id: 'memory', e: '🃏' }
];
const DIF = { 1: 0, 10: .5, 2: 1, 5: 1, 3: 2, 4: 2.5, 9: 3, 6: 3.5, 7: 4, 8: 4 };

let tables0 = []; try { tables0 = JSON.parse(LS.get('pm_tables', '[]')); } catch (e) {}
const S = { screen: 'home', tables: tables0, mode: LS.get('pm_mode', 'mini'), N: 20, paused: false, locked: true, lives: 3, score: 0, level: 1, qi: 0, correct: 0, streak: 0, bestStreak: 0, mist: [], retry: [], recent: [] };
const app = $('#app');
const T = { run: false, left: 0, total: 1, last: 0, ticked: -1 };

/* ---------- zamanlayıcılar ---------- */
const pending = [];
function later(fn, ms) { const id = setTimeout(() => { const i = pending.indexOf(id); if (i >= 0) pending.splice(i, 1); fn(); }, ms); pending.push(id); return id; }
function clearLater() { pending.forEach(clearTimeout); pending.length = 0; }

/* ---------- yardımcılar (oyunlar da kullanır) ---------- */
function tok(layer, pick, val, cls, style, inner) {
  const e = h('div', 'tok ' + cls, inner || `<span>${val}</span>`);
  if (style) css(e, style);
  e.addEventListener('pointerdown', ev => { ev.preventDefault(); pick(val, e); });
  layer.appendChild(e); return e;
}
function pin(el) { // animasyondaki konumu sabitle
  const cs = getComputedStyle(el), st = el.parentNode.getBoundingClientRect(), r = el.getBoundingClientRect();
  el.style.animation = 'none'; el.style.left = (r.left - st.left) + 'px'; el.style.top = (r.top - st.top) + 'px'; el.style.bottom = 'auto'; el.style.transform = 'none';
}
function boom(el) { if (!el) return; pin(el); el.classList.add('boom'); }
function shake(el) { if (!el) return; pin(el); el.classList.add('shake'); }

/* ---------- ekranlar ---------- */
function topbar(backAct, title) {
  return `<div class="bar"><button class="ibtn" data-act="${backAct}" aria-label="${t('back')}">⬅️</button><h2 class="grow">${title}</h2><span style="width:46px"></span></div>`;
}
function langBtns() {
  return ['tr', 'en'].map(l => `<button class="ibtn lang ${LANG === l ? 'on' : ''}" data-act="lang" data-l="${l}">${l === 'tr' ? 'TR' : 'EN'}</button>`).join('');
}
function soundBtns() {
  return `<button class="ibtn ${SND.musicOn ? '' : 'off'}" data-act="music" title="${t('music')}">🎵</button><button class="ibtn ${SND.sfxOn ? '' : 'off'}" data-act="sfx" title="${t('sfx')}">🔊</button>`;
}
const wm = () => 'PlayMath'.split('').map((c, i) => `<span style="color:${['#ff5d8f', '#ffd23f', '#3ddc84', '#3ea8ff', '#ff9f1c', '#b46bff', '#ff5d8f', '#ffd23f'][i]};animation-delay:${i * .09}s">${c}</span>`).join('');

function home() {
  S.screen = 'home'; SND.music('menu');
  app.innerHTML = `<section class="screen home">
    <div class="top-row">${langBtns()}<span class="grow"></span>${soundBtns()}</div>
    <div class="hero">
      <img class="logo" src="logo.png" alt="" onerror="this.style.display='none'">
      <h1 class="wm">${wm()}</h1>
      <p class="tag">${t('tagline')}</p>
      <div class="deco">✖️ 🚀 🐱 🎈</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;align-items:center">
      <button class="btn big" data-act="toTables">▶ ${t('play')}</button>
      <button class="btn sec" data-act="install">📲 ${t('install')}</button>
    </div>
    <div class="credit">${t('made_by')}: <b>Yıldıray Hoca</b><br>${t('contact')}: <a href="mailto:sanalnotum@gmail.com">sanalnotum@gmail.com</a></div>
  </section>`;
}

function tablesScreen() {
  S.screen = 'tables';
  app.innerHTML = `<section class="screen">
    ${topbar('toHome', t('choose_tables'))}
    <p class="sub">${t('tables_sub')}</p>
    <div class="tgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<button class="tile ${S.tables.includes(n) ? 'on' : ''}" data-act="tbl" data-n="${n}"><b>${n}</b><small>× ${n}</small></button>`).join('')}</div>
    <div style="text-align:center"><button class="btn sec" data-act="alltbl" id="alltbl"></button></div>
    <div><p class="sub" style="margin-bottom:6px">${t('mode')}</p>
    <div class="modes">
      <button class="chip ${S.mode === 'mini' ? 'on' : ''}" data-act="mode" data-m="mini">🐣 ${t('mode_mini')}<small>${t('mode_mini_d')}</small></button>
      <button class="chip ${S.mode === 'pro' ? 'on' : ''}" data-act="mode" data-m="pro">🚀 ${t('mode_pro')}<small>${t('mode_pro_d')}</small></button>
    </div></div>
    <span class="grow"></span>
    <div style="text-align:center"><button class="btn big" id="nextBtn" data-act="toWorlds">${t('next')} ➜</button></div>
  </section>`;
  syncTables();
}
function syncTables() {
  const b = $('#nextBtn'); if (b) b.disabled = !S.tables.length;
  const a = $('#alltbl'); if (a) a.textContent = S.tables.length === 10 ? '✖ ' + t('clear') : '✔ ' + t('all');
  LS.set('pm_tables', JSON.stringify(S.tables));
}

function worldsScreen() {
  S.screen = 'worlds';
  app.innerHTML = `<section class="screen">
    ${topbar('toTables', t('choose_world'))}
    <div class="wgrid">${WORLDS.map(w => {
      const st = +LS.get('pm_stars_' + w.id, 0);
      return `<button class="wcard w-${w.id}" data-act="world" data-id="${w.id}"><span class="we">${w.e}</span><b>${t('w_' + w.id)}</b><small>${t('d_' + w.id)}</small><span class="st">${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}</span></button>`;
    }).join('')}</div>
  </section>`;
}

/* ---------- pencere / efektler ---------- */
function modal(html) { closeModal(); const m = h('div', 'modal', `<div class="mbox">${html}</div>`); app.appendChild(m); return m; }
function closeModal() { const m = $('.modal', app); if (m) m.remove(); }
function floatTxt(txt, cls) { if (!S.stage) return; const f = h('div', 'float ' + (cls || ''), txt); S.stage.appendChild(f); later(() => f.remove(), 1200); }
function confetti(n = 36) {
  const em = ['🎉', '⭐', '🎈', '✨', '🌟', '🎊'];
  for (let i = 0; i < n; i++) { const c = h('div', 'conf', em[i % em.length]); c.style.left = rnd(0, 96) + '%'; c.style.animationDelay = (Math.random() * 1.2) + 's'; c.style.fontSize = rnd(20, 38) + 'px'; app.appendChild(c); setTimeout(() => c.remove(), 4200); }
}

/* ---------- soru üretimi ---------- */
function buildPool() {
  const seen = new Set(), p = [];
  S.tables.forEach(a => { for (let b = 1; b <= 10; b++) { const k = Math.min(a, b) + '_' + Math.max(a, b); if (seen.has(k)) continue; seen.add(k); p.push({ x: a, y: b, d: DIF[a] + DIF[b] + Math.random() * .4 }); } });
  return p.sort((u, v) => u.d - v.d);
}
function mkQ(p) { const sw = Math.random() < .5; return { x: sw ? p.y : p.x, y: sw ? p.x : p.y, ans: p.x * p.y, p, key: Math.min(p.x, p.y) + 'x' + Math.max(p.x, p.y) }; }
function pickQ() {
  const r = S.retry.findIndex(o => o.due <= S.qi);
  if (r >= 0) return mkQ(S.retry.splice(r, 1)[0].p);
  const L = S.pool.length, prog = S.qi / (S.N - 1), c = prog * (L - 1), w = Math.max(1, Math.round(L * .1));
  const lo = Math.max(0, Math.floor(c - w)), hi = Math.min(L - 1, Math.ceil(c + w));
  const avoid = S.recent.slice(-Math.max(1, Math.min(6, Math.floor(L / 2))));
  let cand = []; for (let i = lo; i <= hi; i++) if (!avoid.includes(S.pool[i].x + 'x' + S.pool[i].y)) cand.push(S.pool[i]);
  if (!cand.length) cand = S.pool;
  const p = cand[rnd(0, cand.length - 1)]; S.recent.push(p.x + 'x' + p.y); return mkQ(p);
}
function makeOpts(q, n) {
  const a = q.ans, set = new Set(), c = [a + q.x, a - q.x, a + q.y, a - q.y, a + 1, a - 1, a + 10, a - 10, a + 2, a - 2];
  const s = String(a); if (s.length === 2) c.push(+(s[1] + s[0]));
  shuffle(c).forEach(v => { if (v > 0 && v !== a && set.size < n - 1) set.add(v); });
  let guard = 0; while (set.size < n - 1 && guard++ < 99) { const v = a + rnd(-12, 12); if (v > 0 && v !== a) set.add(v); }
  return shuffle([a, ...set]);
}
function optCount() { const m = S.game.opts || 4; return Math.min(m, S.mode === 'mini' && S.level < 3 ? 3 : 4); }
function timeFor() { // saniye: Minik 16 → 8 | Usta ~10 → 4.5
  const L = S.level;
  return (S.mode === 'mini' ? Math.max(8, 17 - L) : Math.max(4.5, 11 - L * .8)) * 1000;
}
function hintFor(x, y) {
  const p = x * y, f = [x, y], o = x === Math.min(x, y) ? Math.max(x, y) : Math.min(x, y);
  if (f.includes(10)) return t('h10', { o: x === 10 ? y : x, p });
  if (f.includes(1)) return t('h1', { o: x === 1 ? y : x });
  if (f.includes(2)) return t('h2', { o: x === 2 ? y : x, p });
  if (f.includes(5)) { const q = x === 5 ? y : x; return t('h5', { o: q, t: 10 * q, p }); }
  if (f.includes(9)) { const q = x === 9 ? y : x; return t('h9', { tens: q - 1, ones: 10 - q, p }); }
  if (f.includes(4)) { const q = x === 4 ? y : x; return t('h4', { o: q, d: q * 2, p }); }
  if (f.includes(3)) { const q = x === 3 ? y : x; return t('h3', { o: q, d: q * 2, p }); }
  const a = Math.min(x, y), b = Math.max(x, y);
  return t('hd', { x: a, y: b, k: a - 5, a: 5 * b, b: (a - 5) * b, p });
}
function dotGrid(x, y) {
  if (x * y > 100) return '';
  let s = ''; for (let i = 0; i < x; i++) for (let j = 0; j < y; j++) s += `<i class="${j >= 5 ? 'b' : ''}"></i>`;
  return `<div class="dots" style="grid-template-columns:repeat(${y},auto)">${s}</div>`;
}

/* ---------- oyun akışı ---------- */
function startGame(id) {
  clearLater(); closeModal();
  Object.assign(S, { screen: 'game', world: id, game: GAMES[id], lives: 3, score: 0, level: 1, qi: 0, correct: 0, streak: 0, bestStreak: 0, mist: [], retry: [], recent: [], paused: false, locked: true, q: null });
  S.pool = buildPool();
  SND.music(id); SND.tempo(1);
  app.innerHTML = `<section class="screen game">
    <div class="hud"><button class="ibtn" data-act="pause">⏸️</button><div class="hearts" id="hearts"></div><div class="lvl" id="lvl"></div><div class="score" id="score">0</div></div>
    <div class="tbar" id="tbarw"><i id="tbar"></i></div>
    <div class="qb" id="qb"><span class="qt">&nbsp;</span></div>
    <div class="stage w-${id}" id="stage"></div>
  </section>`;
  S.stage = $('#stage'); S.game.init(S.stage); hud();
  let n = 3; const c = h('div', 'count', t('ready')); S.stage.appendChild(c);
  const step = () => {
    if (n > 0) { c.textContent = n; SND.sfx('tick'); n--; later(step, 650); }
    else { c.textContent = t('go'); SND.sfx('go'); later(() => { c.remove(); nextQ(); }, 500); }
  };
  later(step, 700);
}
function hud() {
  const hr = $('#hearts'); if (!hr) return;
  hr.textContent = '❤️'.repeat(Math.max(0, S.lives)) + '🖤'.repeat(Math.max(0, 3 - S.lives));
  $('#lvl').textContent = '⭐ ' + t('level') + ' ' + S.level;
  $('#score').textContent = S.score;
}
function nextQ() {
  if (S.lives <= 0 || S.qi >= S.N) return finish();
  const q = pickQ(); S.q = q; S.qi++;
  q.opts = makeOpts(q, optCount()); S.locked = false; S.ms = timeFor();
  $('#qb').innerHTML = `<span class="qn">${S.qi}/${S.N}</span><span class="qt">${q.x} × ${q.y} = <em>?</em></span>`;
  const old = $('.layer', S.stage); if (old) old.remove();
  const layer = h('div', 'layer'); S.stage.appendChild(layer); S.layer = layer;
  stopTimer(); setBar(1);
  const delay = S.game.ask(layer, q, q.opts, S.ms, pickAns) || 0;
  hud();
  if (delay) later(() => { if (!S.locked) startTimer(S.ms); }, delay); else startTimer(S.ms);
}

/* süre çubuğu */
function setBar(f) { const b = $('#tbar'); if (b) { b.style.transform = `scaleX(${f})`; $('#tbarw').classList.toggle('low', f < .3); } }
function startTimer(ms) { T.total = T.left = ms; T.last = performance.now(); T.run = true; T.ticked = -1; requestAnimationFrame(loop); }
function stopTimer() { T.run = false; }
function loop() {
  if (!T.run) return;
  const n = performance.now();
  if (!S.paused) T.left -= Math.min(n - T.last, 120);
  T.last = n; setBar(Math.max(0, T.left / T.total));
  const sec = Math.ceil(T.left / 1000);
  if (T.left < 3000 && sec !== T.ticked && T.left > 0) { T.ticked = sec; SND.sfx('tick'); }
  if (T.left <= 0) { T.run = false; onTimeout(); return; }
  requestAnimationFrame(loop);
}

function pickAns(val, el) {
  if (S.locked || S.paused) return;
  S.locked = true; stopTimer(); S.layer.classList.add('freeze');
  if (val === S.q.ans) rightAns(val, el); else wrongAns(val, el, false);
}
function onTimeout() { if (S.locked) return; S.locked = true; S.layer.classList.add('freeze'); wrongAns(null, null, true); }

function rightAns(val, el) {
  S.correct++; S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak);
  const pts = 10 + Math.round(Math.max(0, T.left / T.total) * 10) + Math.min(S.streak, 5) * 2;
  S.score += pts; SND.sfx('good');
  S.game.react(true, val, el, S.layer);
  const pr = t('praise'); floatTxt(S.streak >= 3 && S.streak % 3 === 0 ? t('streak_msg', { n: S.streak }) : pr[rnd(0, pr.length - 1)], 'big');
  later(() => floatTxt('+' + pts), 250);
  const newL = 1 + Math.floor(S.correct / 4); let wait = 1000;
  if (newL > S.level && S.qi < S.N) {
    S.level = newL; SND.tempo(1 + .04 * (newL - 1)); wait = 1700;
    later(() => { const b = h('div', 'banner', t('levelup', { n: newL })); S.stage.appendChild(b); SND.sfx('level'); later(() => b.remove(), 1500); }, 500);
  }
  hud(); later(nextQ, wait);
}
function wrongAns(val, el, timeout) {
  S.lives--; S.streak = 0; SND.sfx('bad');
  const q = S.q; if (!S.mist.find(m => m.key === q.key)) S.mist.push({ key: q.key, x: q.x, y: q.y });
  S.retry.push({ p: q.p, due: S.qi + 4 });
  S.game.react(false, val, el, S.layer, timeout);
  hud(); later(() => feedback(timeout), 1100);
}
function feedback(timeout) {
  const q = S.q;
  modal(`<h3>${timeout ? '⏰ ' + t('timeup') : '🤔 ' + t('oops')}</h3>
    <p>${t('right_is')}:</p>
    <div class="fbq">${q.x} × ${q.y} = <b>${q.ans}</b></div>
    ${dotGrid(q.x, q.y)}
    <div class="hint">💡 ${hintFor(q.x, q.y)}</div>
    <button class="btn" data-act="fbnext">${t('cont')} ➜</button>`);
}
function pause() {
  if (S.screen !== 'game' || S.paused) return;
  S.paused = true; S.stage.classList.add('paused');
  modal(`<h3>⏸️ ${t('paused')}</h3>
    <div class="mrow"><button class="ibtn ${SND.musicOn ? '' : 'off'}" data-act="music" title="${t('music')}" style="background:#eee">🎵</button><button class="ibtn ${SND.sfxOn ? '' : 'off'}" data-act="sfx" title="${t('sfx')}" style="background:#eee">🔊</button></div>
    <button class="btn" data-act="resume">▶ ${t('resume')}</button>
    <button class="btn sec red" data-act="quit">✖ ${t('quit')}</button>`);
}
function resume() { closeModal(); S.paused = false; S.stage.classList.remove('paused'); T.last = performance.now(); }

/* ---------- sonuç ---------- */
function finish() {
  stopTimer(); clearLater(); S.screen = 'result';
  const done = S.lives > 0, acc = S.qi ? Math.round(S.correct / S.qi * 100) : 0;
  const stars = done ? Math.max(1, S.lives) : (S.correct >= 8 ? 1 : 0);
  const key = 'pm_best_' + S.world, prev = +LS.get(key, 0), isBest = S.score > prev;
  if (isBest) LS.set(key, S.score);
  if (stars > +LS.get('pm_stars_' + S.world, 0)) LS.set('pm_stars_' + S.world, stars);
  SND.sfx(done ? 'win' : 'lose'); SND.music('menu'); SND.tempo(1);
  app.innerHTML = `<section class="screen res">
    <div class="rt">${done ? '🏆 ' + t('won') : '💪 ' + t('lost')}</div>
    <div class="rs">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    <div class="rscore">${S.score}</div>
    <div>${isBest ? '🎉 ' + t('new_best') : t('best') + ': ' + Math.max(prev, S.score)}</div>
    <div class="rrow"><span>✅ ${t('correct_n')}: ${S.correct}</span><span>🎯 ${t('accuracy')}: %${acc}</span><span>🔥 ${t('streak')}: ${S.bestStreak}</span></div>
    ${S.mist.length ? `<h3>📚 ${t('review')}</h3><div class="mlist">${S.mist.map(m => `<span>${m.x}×${m.y}=<b>${m.x * m.y}</b></span>`).join('')}</div>` : `<h3>💯 ${t('perfect')}</h3>`}
    <div class="rbtns"><button class="btn big" data-act="again">🔁 ${t('again')}</button>
    <button class="btn sec" data-act="toWorlds">🎮 ${t('other')}</button>
    <button class="btn sec" data-act="toHome">🏠 ${t('home')}</button></div>
  </section>`;
  if (stars > 0) confetti();
}

/* ---------- olaylar ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
function renderCurrent() { ({ home, tables: tablesScreen, worlds: worldsScreen })[S.screen]?.(); }

const ACT = {
  toHome: () => home(), toTables: () => tablesScreen(), toWorlds: () => worldsScreen(),
  lang: b => { setLang(b.dataset.l); renderCurrent(); },
  music: b => { SND.toggleMusic(); b.classList.toggle('off', !SND.musicOn); },
  sfx: b => { SND.toggleSfx(); b.classList.toggle('off', !SND.sfxOn); },
  install: () => { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; } else modal(`<h3>📲 ${t('install')}</h3><p>${t('install_help')}</p><button class="btn" data-act="closem">${t('ok')}</button>`); },
  closem: () => closeModal(),
  tbl: b => { const n = +b.dataset.n, i = S.tables.indexOf(n); i >= 0 ? S.tables.splice(i, 1) : S.tables.push(n); b.classList.toggle('on', i < 0); syncTables(); },
  alltbl: () => { S.tables = S.tables.length === 10 ? [] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; document.querySelectorAll('.tile').forEach(e => e.classList.toggle('on', S.tables.includes(+e.dataset.n))); syncTables(); },
  mode: b => { S.mode = b.dataset.m; LS.set('pm_mode', S.mode); document.querySelectorAll('.chip').forEach(e => e.classList.toggle('on', e.dataset.m === S.mode)); },
  world: b => startGame(b.dataset.id),
  again: () => startGame(S.world),
  pause: () => { if (!S.locked) pause(); }, resume: () => resume(),
  quit: () => { stopTimer(); clearLater(); closeModal(); S.paused = false; SND.music('menu'); SND.tempo(1); worldsScreen(); },
  fbnext: () => { closeModal(); if (S.lives <= 0) finish(); else nextQ(); }
};
app.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && ACT[b.dataset.act]) ACT[b.dataset.act](b); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S.screen === 'game' && !S.paused && !$('.modal', app) && !S.locked) pause(); });
document.addEventListener('contextmenu', e => e.preventDefault());

const PM = {
  boot() {
    setLang(LANG); home();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  },
  S, pickAns, nextQ
};
