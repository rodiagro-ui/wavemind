// Loads the game script from index.html into a sandbox with a stubbed canvas,
// so the physics engine, solver and level generator can be tested headlessly.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function loadGame() {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const code = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const stub = () => new Proxy(function () {}, {
    get: (t, k) => (k === 'measureText' ? (s => ({ width: String(s).length * 9 })) : stub()),
    apply: () => stub(),
    set: () => true,
  });
  const canvas = { getContext: () => stub(), getBoundingClientRect: () => ({ width: 720, height: 1280, left: 0, top: 0 }), addEventListener() {} };
  const store = {};
  const sandbox = {
    document: { getElementById: () => canvas, fonts: null },
    addEventListener() {}, innerWidth: 720, innerHeight: 1280, devicePixelRatio: 1,
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } },
    location: { hash: '' }, navigator: {}, requestAnimationFrame() {}, performance: { now: () => 0 },
    Math, JSON, Date, URLSearchParams, Float64Array, Uint8Array, Proxy, String, Array, Object,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code + `
;globalThis.__G = { build, evalLv, solveAll, minDist, levelSpec, bossSpec, startLevel, toggle, update, startArcade,
  get lv() { return lv; }, get on() { return on; }, get res() { return res; }, get state() { return state; },
  get arc() { return arc; }, CH, LAST, BOSS, PER, TUT, TUT_R1, TUT_E1, CARDS, EN, qrMatrix, PLAY_URL };`, sandbox);
  return sandbox.__G;
}
