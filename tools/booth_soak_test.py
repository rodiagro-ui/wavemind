# Booth soak test: many back-to-back Arcade players in ONE page, like a real event day.
# Checks a clean reset between players, frame rate and JS heap over time, and reports page errors.
# Usage:  npx serve . -l 8732   (in the repo root)   then   python tools/booth_soak_test.py 30
# Needs:  pip install playwright && python -m playwright install chromium
import json, sys, time
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8732/index.html'
RUNS = int(sys.argv[1]) if len(sys.argv) > 1 else 30
with sync_playwright() as p:
    b = p.chromium.launch(args=['--enable-precise-memory-info'])
    ctx = b.new_context(viewport={'width': 720, 'height': 1280})
    pg = ctx.new_page(); errors = []
    pg.on('crash', lambda: print('PAGE CRASHED'))
    pg.on('pageerror', lambda e: errors.append(str(e)[:150]))
    pg.goto(BASE + '#portada'); pg.wait_for_timeout(1500)
    rows = []
    for r in range(RUNS):
        # one "player": start from the title, play a full arcade run with the hint bot, enter initials, back to title
        ok = pg.evaluate("state = 'title'; mode = 'story'; startArcade(); arc.time === 75 && arc.score === 0 && arc.solved === 0 && arc.streak === 0")   # clean reset, checked atomically
        t0 = time.time(); target = 4 + r % 5          # each "player" solves 4-8 puzzles, then the clock runs out
        while time.time() - t0 < 40:
            st = pg.evaluate("[state, arc.solved, lv && lv.hand]")
            if st[0] in ('initials', 'board'): break
            if st[1] >= target: pg.evaluate("arc.time = 0.01"); pg.wait_for_timeout(300); continue
            if st[0] == 'play' and st[2] is not None and st[2] >= 0: pg.evaluate(f"toggle({st[2]})")
            pg.wait_for_timeout(60)
        if pg.evaluate("state") == 'initials':
            pg.evaluate("initials = ['B','O','T']; commitInitials()")
        fps = pg.evaluate("""new Promise(res => { let n = 0; const t = performance.now();
            function f() { n++; if (performance.now() - t < 1000) requestAnimationFrame(f); else res(n); } requestAnimationFrame(f); })""")
        heap = pg.evaluate("performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10 : -1")
        info = pg.evaluate("[arc.score, arc.solved, (save.board || []).length, popups.length]")
        rows.append({'run': r + 1, 'clean_reset': ok, 'score': info[0], 'solved': info[1], 'board': info[2],
                     'popups': info[3], 'fps': fps, 'heap_mb': heap})
        print(rows[-1], flush=True)
    print('page errors:', len(errors), errors[:3])
    json.dump(rows, open('soak_result.json', 'w'), indent=1)
    print('fps min/max:', min(r['fps'] for r in rows), max(r['fps'] for r in rows), '| heap MB min/max:', min(r['heap_mb'] for r in rows), max(r['heap_mb'] for r in rows))
    b.close()
