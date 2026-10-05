/* PlayMath – audio.js : ses dosyası YOK; müzik ve efektler Web Audio ile kodla üretilir */
const SND = (() => {
  let ctx, musicG, sfxG, noiseBuf, timer = null, want = null, theme = null, step = 0, nextT = 0, tempo = 1;
  let musicOn = LS.get('pm_music', '1') === '1', sfxOn = LS.get('pm_sfx', '1') === '1';

  const SC = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10] };
  // bpm, root(MIDI), sc, prog(akor derecesi), lw(lead dalga), bw(bas dalga), kick/snare/hat/bass(16 adım), dens(melodi yoğunluğu), len(nota uzunluğu), v(lead ses)
  const TH = {
    menu:   { bpm: 112, root: 60, sc: 'maj', prog: [0, 4, 5, 3], lw: 'triangle', bw: 'sine', kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'x.....x.x.....x.', seed: 7, dens: .65, len: 1.6, v: .24 },
    space:  { bpm: 126, root: 57, sc: 'min', prog: [0, 5, 3, 6], lw: 'sawtooth', bw: 'sawtooth', kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'x.x.x.x.x.x.x.x.', seed: 11, dens: .8, len: 1.2, v: .1 },
    car:    { bpm: 152, root: 52, sc: 'min', prog: [0, 0, 5, 6], lw: 'square', bw: 'sawtooth', kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', bass: 'x.xxx.xxx.xxx.xx', seed: 19, dens: .85, len: 1, v: .09 },
    plane:  { bpm: 138, root: 62, sc: 'maj', prog: [0, 3, 4, 0], lw: 'triangle', bw: 'sine', kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'x...x...x...x...', seed: 23, dens: .8, len: 1.4, v: .26 },
    run:    { bpm: 148, root: 55, sc: 'maj', prog: [0, 5, 3, 4], lw: 'square', bw: 'sawtooth', kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'x.x.x.x.x.x.x.x.', seed: 29, dens: .8, len: 1, v: .09 },
    cat:    { bpm: 108, root: 64, sc: 'maj', prog: [0, 3, 4, 0], lw: 'sine', bw: 'sine', kick: 'x.......x.......', snare: '........x.......', hat: '..x...x...x...x.', bass: 'x.......x.......', seed: 31, dens: .55, len: .7, v: .3 },
    dog:    { bpm: 124, root: 60, sc: 'maj', prog: [0, 3, 0, 4], lw: 'square', bw: 'triangle', kick: 'x...x...x...x...', snare: '....x.......x...', hat: '.x.x.x.x.x.x.x.x', bass: 'x..x..x.x..x..x.', seed: 37, dens: .75, len: .9, v: .08 },
    bird:   { bpm: 132, root: 67, sc: 'maj', prog: [0, 4, 5, 3], lw: 'triangle', bw: 'sine', kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'x.......x.......', seed: 41, dens: .9, len: .6, v: .28 },
    balloon:{ bpm: 120, root: 62, sc: 'maj', prog: [0, 3, 0, 4], lw: 'sine', bw: 'triangle', kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'x.x...x.x.x...x.', seed: 43, dens: .75, len: 1, v: .3 },
    frog:   { bpm: 116, root: 55, sc: 'min', prog: [0, 3, 4, 0], lw: 'square', bw: 'triangle', kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'x..x..x.x..x..x.', seed: 47, dens: .7, len: .7, v: .08 },
    memory: { bpm: 100, root: 57, sc: 'min', prog: [0, 5, 3, 4], lw: 'triangle', bw: 'sine', kick: 'x.......x.......', snare: '................', hat: '................', bass: 'x.......x.......', seed: 53, dens: .5, len: 2, v: .26 }
  };

  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const d2m = (th, d) => { const o = Math.floor(d / 7), k = ((d % 7) + 7) % 7; return th.root + SC[th.sc][k] + 12 * o; };

  function build(th) {
    if (th.lead) return;
    let s = th.seed * 9301 + 49297;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    th.lead = th.prog.map(() => {
      const bar = []; let last = 0;
      for (let i = 0; i < 16; i++) {
        const strong = i % 4 === 0;
        if (r() < (strong ? Math.min(.95, th.dens + .2) : th.dens * .55)) {
          let d;
          if (strong) d = [0, 2, 4, 7][Math.floor(r() * 4)];
          else { d = last + [-2, -1, 1, 2][Math.floor(r() * 4)]; d = Math.max(-2, Math.min(9, d)); }
          last = d; bar.push(d);
        } else bar.push(null);
      }
      return bar;
    });
  }

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    musicG = ctx.createGain(); musicG.gain.value = musicOn ? .35 : 0; musicG.connect(master);
    sfxG = ctx.createGain(); sfxG.gain.value = sfxOn ? .8 : 0; sfxG.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tone(f, t, dur, type, vol, dest, to) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + .05);
  }
  function noise(t, dur, vol, dest, hp) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + .02);
  }

  function schedule(s, t) {
    const th = theme, sd = 60 / (th.bpm * tempo) / 4;
    const bar = Math.floor(s / 16) % th.prog.length, i = s % 16, ch = th.prog[bar];
    if (th.bass[i] === 'x') tone(mf(d2m(th, ch) - 24), t, sd * 1.8, th.bw, th.bw === 'sawtooth' ? .16 : .42, musicG);
    const n = th.lead[bar][i];
    if (n !== null) tone(mf(d2m(th, ch + n) + 12), t, sd * th.len, th.lw, th.v, musicG);
    if (th.kick[i] === 'x') tone(150, t, .16, 'sine', .7, musicG, 45);
    if (th.snare[i] === 'x') noise(t, .13, .22, musicG, 1500);
    if (th.hat[i] === 'x') noise(t, .04, .07, musicG, 7500);
  }
  function tick() {
    if (!ctx || !theme) return;
    while (nextT < ctx.currentTime + .15) {
      schedule(step, nextT);
      nextT += 60 / (theme.bpm * tempo) / 4; step++;
    }
  }
  function start() {
    if (!ctx || ctx.state !== 'running' || !want || !TH[want]) return;
    theme = TH[want]; build(theme); step = 0; nextT = ctx.currentTime + .08;
    if (!timer) timer = setInterval(tick, 30);
  }

  function unlock() {
    init(); if (!ctx) return;
    if (ctx.state !== 'running') { ctx.resume().then(() => { if (want && !theme) start(); else if (want) start(); }).catch(() => {}); }
  }
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
  // tıklanan her düğmede ses (oyun içi cevap jetonları kendi sesini çalar)
  document.addEventListener('pointerdown', e => {
    if (e.target.closest && e.target.closest('button,.btn,[data-act],a')) { init(); sfx('click'); }
  }, true);

  const F = {
    click: t => tone(620, t, .07, 'sine', .3, sfxG, 980),
    tap:   t => tone(420, t, .09, 'triangle', .35, sfxG, 260),
    flip:  t => { tone(500, t, .06, 'square', .12, sfxG, 900); },
    good:  t => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .07, .18, 'triangle', .38, sfxG)),
    bad:   t => { tone(240, t, .3, 'sawtooth', .22, sfxG, 110); tone(180, t + .12, .3, 'sawtooth', .18, sfxG, 80); },
    boom:  t => { noise(t, .35, .35, sfxG, 250); tone(180, t, .3, 'sine', .5, sfxG, 40); },
    pop:   t => { noise(t, .08, .3, sfxG, 1200); tone(900, t, .08, 'triangle', .3, sfxG, 300); },
    whoosh:t => noise(t, .3, .18, sfxG, 600),
    tick:  t => tone(1100, t, .05, 'square', .12, sfxG),
    go:    t => { tone(660, t, .12, 'square', .2, sfxG); tone(990, t + .12, .3, 'square', .2, sfxG); },
    level: t => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * .09, .22, 'square', .2, sfxG)),
    win:   t => [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * .12, .3, 'triangle', .4, sfxG)),
    lose:  t => [392, 349, 311, 262].forEach((f, i) => tone(f, t + i * .2, .35, 'triangle', .4, sfxG)),
    coin:  t => { tone(988, t, .08, 'square', .15, sfxG); tone(1319, t + .08, .25, 'square', .15, sfxG); }
  };
  function sfx(n) { if (!ctx || !sfxOn || ctx.state !== 'running' || !F[n]) return; F[n](ctx.currentTime + .005); }

  return {
    unlock, sfx,
    music(n) { if (want === n && theme === TH[n]) return; want = n; theme = null; start(); },
    tempo(m) { tempo = Math.min(1.3, Math.max(.8, m)); },
    toggleMusic() { musicOn = !musicOn; LS.set('pm_music', musicOn ? '1' : '0'); if (musicG) musicG.gain.value = musicOn ? .35 : 0; return musicOn; },
    toggleSfx() { sfxOn = !sfxOn; LS.set('pm_sfx', sfxOn ? '1' : '0'); if (sfxG) sfxG.gain.value = sfxOn ? .8 : 0; return sfxOn; },
    get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; }
  };
})();
