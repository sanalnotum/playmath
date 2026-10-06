/* PlayMath – games2.js : Kedi, Köpek, Kuş, Kurbağa, Hafıza */

/* 🐱 KEDİ: doğru mamayı kediye ver */
GAMES.cat = {
  opts: 4,
  init(st) {
    st.innerHTML = '<div class="meter"><i></i></div><div class="catbox"><div class="bub">🍽️ ?</div><div class="cat">🐱</div></div>';
    this.cat = $('.cat', st); this.m = $('.meter i', st); this.m.style.width = '0%';
  },
  ask(L, q, opts, ms, pick) {
    this.cat.textContent = '🐱'; L.classList.add('bowlrow');
    const food = ['🐟', '🥛', '🍗', '🍤', '🥩'];
    opts.forEach(v => tok(L, pick, v, 'bowl', null, `<i>${food[rnd(0, 4)]}</i><span>${v}</span>`));
  },
  react(ok, v, el, L) {
    if (ok) {
      this.cat.textContent = '😻'; SND.sfx('coin');
      this.m.style.width = Math.min(100, Math.round(S.correct / S.N * 100)) + '%';
      if (el) el.classList.add('boom');
    } else {
      this.cat.textContent = el ? '😾' : '😿';
      if (el) el.classList.add('shake');
    }
  }
};

/* 🐶 KÖPEK: kemikler düşer, doğrusunu köpeğe yakalat */
GAMES.dog = {
  opts: 4,
  init(st) { st.innerHTML = '<div class="sun">☀️</div><div class="dog">🐕</div>'; this.d = $('.dog', st); },
  ask(L, q, opts, ms, pick) {
    this.d.className = 'dog'; this.d.style.left = 'calc(50% - 33px)';
    const n = opts.length;
    opts.forEach((v, i) => tok(L, pick, v, 'bone', { left: `calc(${(i + .5) * 100 / n}% - 42px)`, '--from': `-${rnd(0, 40)}px`, animationDuration: ms + 'ms' }));
  },
  react(ok, v, el, L) {
    if (!el) { this.d.classList.add('sad'); SND.sfx('boom'); return; }
    pin(el); const x = parseFloat(el.style.left);
    this.d.style.left = (x + 9) + 'px';
    el.style.transition = 'top .45s ease-in, left .3s';
    requestAnimationFrame(() => { el.style.top = 'calc(100% - 100px)'; });
    if (ok) { SND.sfx('coin'); setTimeout(() => el.classList.add('gone'), 450); }
    else { SND.sfx('bad'); this.d.classList.add('sad'); }
  }
};

/* 🐦 KUŞ: yavrulara doğru yemi götür */
GAMES.bird = {
  opts: 4,
  init(st) {
    st.innerHTML = '<div class="nest"><span class="eggs"></span></div><div class="mom">🐦</div>';
    this.mom = $('.mom', st); this.eggs = $('.eggs', st); this.upd();
  },
  upd() { const n = Math.floor(S.correct / (S.N / 5)); this.eggs.textContent = Array.from({ length: 5 }, (_, i) => i < n ? '🐥' : '🥚').join(''); },
  ask(L, q, opts, ms, pick) {
    this.mom.className = 'mom'; this.mom.style.left = ''; this.mom.style.top = '';
    const spots = shuffle([[20, 42], [68, 38], [30, 76], [74, 72]]), food = ['🐛', '🪱', '🌰', '🍓', '🌾'];
    opts.forEach((v, i) => tok(L, pick, v, 'worm', { left: `calc(${spots[i][0]}% - 42px)`, top: `calc(${spots[i][1]}% - 42px)`, '--d': (rnd(0, 15) / 10) + 's' }, `<i>${food[rnd(0, 4)]}</i><span>${v}</span>`));
  },
  react(ok, v, el) {
    if (!el) { this.mom.classList.add('no'); SND.sfx('bad'); return; }
    this.mom.style.left = (el.offsetLeft + 12) + 'px'; this.mom.style.top = (el.offsetTop - 14) + 'px';
    if (ok) {
      SND.sfx('coin');
      later(() => { el.classList.add('gone'); this.mom.style.left = ''; this.mom.style.top = ''; this.upd(); }, 550);
    } else { SND.sfx('bad'); this.mom.classList.add('no'); }
  }
};

/* 🐸 KURBAĞA: yapraklar yavaşça batar, doğru yaprağa zıpla */
GAMES.frog = {
  opts: 4,
  init(st) { st.innerHTML = '<div class="frog">🐸</div>'; this.f = $('.frog', st); },
  ask(L, q, opts, ms, pick) {
    this.f.className = 'frog'; this.f.style.left = 'calc(50% - 32px)'; this.f.style.top = 'calc(100% - 90px)';
    const spots = shuffle([[24, 24], [76, 28], [30, 56], [72, 60]]);
    opts.forEach((v, i) => tok(L, pick, v, 'pad', { left: `calc(${spots[i][0]}% - 48px)`, top: `calc(${spots[i][1]}% - 48px)`, animationDuration: ms + 'ms' }));
  },
  react(ok, v, el, L) {
    if (!el) { this.f.classList.add('sink'); SND.sfx('bad'); return; }
    this.f.style.left = (el.offsetLeft + 16) + 'px'; this.f.style.top = (el.offsetTop - 8) + 'px';
    if (ok) { SND.sfx('coin'); el.style.filter = 'brightness(1.4)'; }
    else { SND.sfx('bad'); setTimeout(() => { this.f.classList.add('sink'); const s = h('div', 'float', '💦'); s.style.top = (el.offsetTop - 10) + 'px'; L.appendChild(s); }, 450); }
  }
};

/* 🃏 HAFIZA: kartlara bak, kapanınca doğru sonucu hatırla */
GAMES.memory = {
  opts: 4,
  init(st) { st.innerHTML = ''; },
  ask(L, q, opts, ms, pick) {
    L.classList.add('cards'); this.ready = false;
    const mini = S.mode === 'mini', peek = Math.max(mini ? 1500 : 900, (mini ? 3200 : 2000) - S.level * 250);
    this.cards = opts.map(v => {
      const c = h('div', 'card show', `<div class="in"><div class="f"><span>${v}</span></div><div class="b">❓</div></div>`);
      c.addEventListener('pointerdown', ev => {
        ev.preventDefault(); if (!this.ready || S.locked) return;
        c.classList.add('show'); SND.sfx('flip'); pick(v, c);
      });
      c.dataset.v = v; L.appendChild(c); return c;
    });
    setTimeout(() => { this.cards.forEach(c => c.classList.remove('show')); SND.sfx('flip'); setTimeout(() => { this.ready = true; }, 450); }, peek);
    return peek + 500;
  },
  react(ok, v, el) {
    this.ready = false;
    this.cards.forEach(c => { c.classList.add('show'); if (+c.dataset.v === S.q.ans) c.classList.add('good'); else if (c === el) c.classList.add('bad'); });
    SND.sfx(ok ? 'coin' : 'bad');
  }
};
