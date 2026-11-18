import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './load-game.mjs';

const G = loadGame();
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const onFor = (lv, mask) => { const on = lv.on0.slice(); lv.tog.forEach((k, j) => { on[k] = (mask >> j) & 1; }); return on; };

test('Mach-Zehnder: a pi cable makes the false answer cancel exactly', () => {
  const lv = G.build(G.TUT[7]);                       // "Does the Moon make its own light?"
  const wins = G.solveAll(lv);
  assert.equal(wins.length, 1);
  const r = G.evalLv(lv, onFor(lv, wins[0]), true);
  assert.ok(close(r.amp[lv.outputs[0]], 0), 'YES amplitude must be exactly 0');
  assert.ok(close(r.P[1], 1), 'NO must be 100%');
  assert.ok(close(r.total, 1), 'unitary case: total probability 1');
});

test('Born rule: probabilities are normalized', () => {
  for (const spec of G.TUT) {
    const lv = G.build(spec);
    const r = G.evalLv(lv, lv.on0, true);
    if (r.total > 1e-9) assert.ok(close(r.P.reduce((a, b) => a + b, 0), 1), spec.q);
  }
});

test('Decoherence: a hot neuron turns interference into a 50/50 mixture', () => {
  const lv = G.build(G.TUT_R1);
  const r = G.evalLv(lv, lv.on0, true);               // start state routes through the hot neuron
  assert.ok(close(r.P[0], 0.5) && close(r.P[1], 0.5));
  const wins = G.solveAll(lv);
  assert.equal(G.minDist(lv.start, wins), 2, 'route around the heat in 2 moves');
});

test('Observer effect: covering the spy eye restores interference', () => {
  const lv = G.build(G.TUT_E1);
  const open = G.evalLv(lv, lv.on0, true);
  assert.ok(close(open.P[0], 0.5), 'eye open: 50/50');
  const on = lv.on0.slice(); on[lv.E] = 0;            // cover the eye
  const covered = G.evalLv(lv, on, true);
  assert.ok(close(covered.P[0], 1), 'eye covered: YES 100%');
});

test("Grover boss: the oracle-marked card reaches exactly 100% with all 4 mirrors", () => {
  for (let r = 0; r < 8; r++) {
    const lv = G.build(G.bossSpec());
    const m = lv.target.indexOf(1);
    const start = G.evalLv(lv, lv.on0, true);
    assert.ok(close(start.P[m], 0.75, 1e-6), 'without mirrors the mark is only 75%');
    const all = lv.on0.slice(); lv.tog.forEach(k => { all[k] = 1; });
    const end = G.evalLv(lv, all, true);
    assert.ok(close(end.P[m], 1), 'marked card 100%');
    assert.equal(G.minDist(lv.start, G.solveAll(lv)), 4);
  }
});

test('Every story level (1-30) is solvable and deterministic', () => {
  for (let n = 1; n <= G.LAST; n++) {
    const a = G.build(G.levelSpec(n)), b = G.build(G.levelSpec(n));
    const wa = G.solveAll(a);
    assert.ok(wa.length > 0, `level ${n} has a solution`);
    const par = G.minDist(a.start, wa);
    assert.ok(par >= 1, `level ${n} is not solved at start`);
    assert.deepEqual(G.solveAll(b), wa, `level ${n} is generated deterministically`);
  }
});

test('Arcade: a run lasts exactly 75 seconds and scores solved puzzles', () => {
  G.startArcade();
  let t = 0, guard = 0;
  while (G.state !== 'initials' && G.state !== 'board' && guard++ < 5000) {
    if (G.state === 'play' && guard % 6 === 0 && G.lv.hand >= 0) G.toggle(G.lv.hand);
    G.update(0.05); t += 0.05;
  }
  assert.ok(Math.abs(t - 75) < 0.2, `run lasted ${t.toFixed(2)} s`);
  assert.ok(G.arc.solved > 5 && G.arc.score > 0);
});

test('English translation covers every card and chapter', () => {
  for (const c of G.CARDS) { assert.ok(G.EN[c.name], c.name); assert.ok(G.EN[c.fact], c.fact.slice(0, 30)); }
  for (const c of G.CH) { assert.ok(G.EN[c.name], c.name); assert.ok(G.EN[c.desc], c.desc); }
});

test('QR matrix for PLAY_URL is square, version 3 (29x29), and has finder patterns', () => {
  const m = G.qrMatrix(G.PLAY_URL);
  const n = m.length;
  // square
  assert.equal(n, m[0].length, 'matrix is square');
  // version 3: side = 29 (39-byte URL needs 41 data bytes → v3 with 44 data bytes)
  assert.equal(n, 29, 'PLAY_URL should produce version 3 QR (29x29)');
  // finder pattern 7x7 in top-left corner
  const finder = (r0, c0) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const expected = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        assert.equal(m[r0 + r][c0 + c], expected, `finder at (${r0 + r},${c0 + c})`);
      }
    }
  };
  finder(0, 0);          // top-left
  finder(0, n - 7);      // top-right
  finder(n - 7, 0);      // bottom-left
});

test('QR format bits: EC indicator is level M (0b00) and timing modules (6,8),(8,6) are dark', () => {
  const m = G.qrMatrix(G.PLAY_URL);
  // timing modules (6,8) and (8,6) must be dark
  assert.ok(m[6][8], 'timing module (6,8) must be dark');
  assert.ok(m[8][6], 'timing module (8,6) must be dark');
  // read 15 format bits from top-left copy in ISO 18004 order (bit 14 first, bit 0 last)
  // placeFormat writes bit i to p1[i] where p1 is:
  // [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]
  // bit 14→(8,0), bit 13→(8,1), ..., bit 0→(0,8)
  const p1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  let info = 0;
  for (let i = 0; i < 15; i++) {
    const [r, c] = p1[i];
    info = (info << 1) | (m[r][c] ? 1 : 0);
  }
  // XOR with 0x5412 (ISO 18004 §7.9)
  const xorred = info ^ 0x5412;
  // EC indicator is bits 13-14 of the 5-bit info field (top 2 bits after XOR)
  const ecBits = (xorred >> 13) & 0b11;
  assert.equal(ecBits, 0, 'EC indicator bits 13-14 must be 0b00 (level M)');
});
