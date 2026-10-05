/* PlayMath – games1.js : Uzay, Araba, Uçak, Koşu, Balon */

/* 🚀 UZAY: asteroitler düşer, doğru sonuçlu olana dokun */
GAMES.space = {
  opts: 4,
  init(st) { st.innerHTML = '<div class="stars"></div><div class="ship">🚀</div>'; this.ship = $('.ship', st); },
  ask(L, q, opts, ms, pick) {
    const n = opts.length;
    opts.forEach((v, i) => tok(L, pick, v, 'ast', { left: `calc(${(i + .5) * 100 / n}% - 40px)`, '--from': `-${rnd(0, 50)}px`, animationDuration: ms + 'ms' }));
  },
  react(ok, v, el) {
    const s = this.ship;
    if (el) s.style.left = `calc(${el.style.left} + 0px)`;
    if (ok) { SND.sfx('boom'); boom(el); }
    else { if (el) { SND.sfx('boom'); shake(el); } s.classList.add('hit'); setTimeout(() => s.classList.remove('hit'), 700); }
  }
};

/* 🏎️ ARABA: 3 şerit, doğru sayılı şeride geç */
const LANE = [16.7, 50, 83.3];
GAMES.car = {
  opts: 3,
  init(st) { st.innerHTML = '<div class="road"></div><div class="car">🏎️</div>'; this.car = $('.car', st); this.lane(1); },
  lane(i) { this.car.style.left = `calc(${LANE[i]}% - 35px)`; },
  ask(L, q, opts, ms, pick) {
    this.cur = opts; this.car.className = 'car'; this.lane(1);
    opts.forEach((v, i) => tok(L, pick, v, 'gate', { left: `calc(${LANE[i]}% - 50px)`, animationDuration: ms + 'ms' }));
  },
  react(ok, v, el) {
    const i = this.cur.indexOf(v); if (i >= 0) this.lane(i);
    if (ok) { SND.sfx('whoosh'); this.car.classList.add('zoom'); boom(el); }
    else { SND.sfx('boom'); this.car.classList.add('crash'); if (el) shake(el); }
  }
};

/* ✈️ UÇAK: sağdan gelen halkalardan doğru olanından geç */
const PY = [22, 50, 78];
GAMES.plane = {
  opts: 3,
  init(st) {
    st.innerHTML = '<div class="cloud c1">☁️</div><div class="cloud c2">☁️</div><div class="cloud c3">☁️</div><div class="plane">✈️</div>';
    this.p = $('.plane', st); this.p.style.top = 'calc(50% - 30px)';
  },
  ask(L, q, opts, ms, pick) {
    this.cur = opts; this.p.className = 'plane'; this.p.style.top = 'calc(50% - 30px)';
    opts.forEach((v, i) => tok(L, pick, v, 'ring', { top: `calc(${PY[i]}% - 45px)`, animationDuration: ms + 'ms' }));
  },
  react(ok, v, el) {
    const i = this.cur.indexOf(v); if (i >= 0) this.p.style.top = `calc(${PY[i]}% - 30px)`;
    if (ok) { SND.sfx('whoosh'); this.p.classList.add('dash'); boom(el); }
    else { SND.sfx('boom'); this.p.classList.add('spin'); if (el) shake(el); }
  }
};

/* 🏃 KOŞU: doğru cevap koşucuyu ilerletir, tavşanı geç! */
GAMES.run = {
  opts: 4,
  init(st) {
    st.innerHTML = '<div class="runscene"><div class="lane l1"><b class="me">🏃</b></div><div class="lane l2"><b class="rv">🐇</b></div><span class="flag">🏁</span></div>';
    this.me = 2; this.rv = 2; this.pos();
  },
  pos() { $('.me', S.stage).style.left = this.me + '%'; $('.rv', S.stage).style.left = this.rv + '%'; },
  ask(L, q, opts, ms, pick) {
    const g = h('div', 'runopts'); L.appendChild(g);
    opts.forEach(v => tok(g, pick, v, 'opt'));
  },
  react(ok, v, el) {
    const step = 82 / S.N;
    this.rv = Math.min(88, this.rv + step * .8 + (ok ? 0 : step * .5));
    if (ok) { this.me = Math.min(88, this.me + step); SND.sfx('whoosh'); if (el) el.classList.add('boom'); }
    else if (el) el.classList.add('shake');
    this.pos();
  }
};

/* 🎈 BALON: yükselen balonlardan doğru olanı patlat */
const BC = ['#ff5d8f', '#ffb703', '#3ddc84', '#3ea8ff', '#b46bff'];
GAMES.balloon = {
  opts: 4,
  init(st) { st.innerHTML = '<div class="cloud c1">☁️</div><div class="cloud c2">☁️</div>'; },
  ask(L, q, opts, ms, pick) {
    const n = opts.length;
    opts.forEach((v, i) => tok(L, pick, v, 'bal', { left: `calc(${(i + .5) * 100 / n}% - 45px)`, '--c': BC[(i + rnd(0, 4)) % 5], '--from': `${rnd(0, 60)}px`, animationDuration: ms + 'ms' }));
  },
  react(ok, v, el) {
    SND.sfx('pop');
    if (el) { ok ? boom(el) : shake(el); }
  }
};
