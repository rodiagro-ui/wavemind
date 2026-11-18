# How WAVEMIND was built: one human and two AI agents

> Entry for the **Best AI-Powered Workflow Story** bonus. Everything here comes from the project log and the git history. Where something hasn't happened yet, it says so.

## TL;DR
- **The author** is an agronomist, not a game developer. He set the direction, played every build and rejected anything that wasn't fun.
- **Claude Code** (Anthropic) was the lead engineering agent. It prototyped, simulated the physics, built the solver and the test suite, and ran automated playtesting bots.
- **Junie** (JetBrains), driven from **JetBrains Air** inside **WebStorm**, took scoped feature tasks on the same codebase. Claude then reviewed its work and checked it against the tests.
- **Result:** about two days from "a game about quantum physics" to a tested, deployed booth game, after throwing away six prototypes.

## The loop that made it work
```
human intent (one sentence, in Spanish)
   → agent builds a playable prototype (single HTML file)
   → bots play it hundreds of times and report numbers
   → human plays it on a phone and gives blunt feedback
   → keep, pivot or kill
```
The bots made the feedback concrete. "Is it skill or luck?" was answered with win rates, not opinions.

## Six games we threw away (in two days)
| # | Prototype | Physics | Why it died |
|---|---|---|---|
| 1 | COLLAPSE | 1-D Schrödinger, split-step FFT | "Not fun, not addictive." |
| 2 | ENTANGLED | Match-3 with entangled pairs | A reskin, not quantum gameplay |
| 3 | AMPLITUDE v1–v2 | Hadamard quantum walk (pachinko) | "Pure chance, I only press a button." Bots: random players got 12–16 %, skilled players 26–42 % |
| 4 | AMPLITUDE v3–v5 | Gaussian wave packet launcher; Bohmian pilot-wave trajectories | Skill mattered, but "too many things to understand" |
| 5 | DON'T LOOK | Double slit with which-path measurement | Correct, but it didn't click |
| 6 | **Q-BRAIN → WAVEMIND** | Amplitude network with interference, decoherence and Grover | ✅ "The dynamic is really cool." |

**What changed.** In the earlier games the player *hoped* for interference. In WAVEMIND the player *designs* it. That inversion came from the human's idea of "wiring a quantum AI", and the agents made it scientifically honest.

## Where the human steered (feedback quotes, translated)
- *"I don't understand what happens when I tap each point."* → tap-to-preview, tap-to-confirm controls that show the outcome of a move before it happens.
- *"It should be governed by real science."* → we renamed "energy" to "wave/amplitude", because energy doesn't cancel and amplitude does. We also added an in-game page that lists what we simplified.
- *"Light, but super eye-catching."* → three visual themes; the human picked **Wave**.
- *"An end-of-level sequence that makes you want another."* → a collectible card album with 16 animated cards about real quantum phenomena.
- **Senior game-design review** (the human asked the agent to critique the game as a veteran designer would). The review led to Booth Mode: a 75-second arcade, a leaderboard, attract mode, a text-free tutorial, English by default, and Grover as the "wow" boss.

## Where AI did the heavy lifting
- **Exact physics in a tiny engine.** Amplitudes split as a/√k, π cables flip the sign, measurement follows the Born rule, and decoherence uses which-path tags. Everything is unit-tested.
- **A level generator with a proof of solvability.** A brute-force solver checks up to 4,096 configurations per level. It computes the optimum (stars and scoring) and rejects levels where interference or noise wouldn't matter.
- **Balance by simulation.**
  - First the arcade gave bonus time per solve. A superhuman bot never died (802 puzzles), so we switched to a fixed 75 s.
  - A random player wins 0–13 % of story levels from level 14 on.
- **Grover's algorithm as a real boss.** The board starts at 75 % on the marked card and reaches exactly 100 % with all four diffusion mirrors. That is the real inversion about the mean, not a metaphor.

## JetBrains tools
| Tool | Used for |
|---|---|
| **WebStorm 2026.3** | Project home: editing, git, running `npm test` |
| **JetBrains Air** | Workspace for delegating tasks to agents and reviewing their changes |
| **Junie** | Scoped feature tasks (log below) |

### Junie task log
| # | Task given to Junie | Result | Reviewed by |
|---|---|---|---|
| 1 | Colorblind-friendly mode: a title-screen toggle; π cables drawn dashed with +/− glyphs; strings in both languages; physics untouched; `npm test` must stay green | Shipped after **3 review rounds** (below) | Claude + author |
| 2 | Event-booth tools on the leaderboard: export the day's scores as CSV; two-tap safe reset with no blocking dialogs; dates stored on entries | Shipped after **2 review rounds** (below) | Claude + author |
| 3 | "Play at home" QR code with **no libraries**: a from-scratch QR encoder (byte mode, ECC M, Reed–Solomon over GF(256), 8 masks with penalty scoring), shown after an arcade run and in attract mode | Shipped after **3 review rounds**; Claude finished the attract-mode layout | Claude + author |

**Task 1, round by round** (Junie Lite through JetBrains Air in WebStorm, 18-Nov-2026)

**Round 1.** Junie added the toggle, saved it with `save.cb`, drew dashed π segments in all three themes and added the +/− glyphs. It reported "all 8 tests pass", which was true. Claude's review found five problems the tests couldn't see:
1. The glyph sat at `e.pts[30]`, the *end* of the cable, hidden under the node.
2. A regression for every player: cut cables lost their dashed style even with the mode off.
3. The Daily button was pushed below the 1280-px canvas.
4. A wrong Spanish label ("Dificultad de color" instead of "Daltonismo").
5. Signs drawn on decoherent cables, which have no phase.

**Round 2.** The author pasted Claude's review into Junie, and Junie fixed all five points. Claude's visual check then found the new button overlapping the language button by 80 px. Junie's own summary had said "nothing cut off".

**Round 3.** A precise layout fix (three 160-px buttons). Claude verified it on screen: toggling works in both languages and the tests stay green.

**Task 2, round by round**

Learning from task 1, the brief already gave exact coordinates, the data format and a "no alert()/confirm()" rule.

**Round 1.** It worked logically, and the tests passed. Claude's review found three problems:
- The confirm label overflowed its button (verified on screen).
- The "Exported!" and "Leaderboard reset!" feedback could never appear, because the leaderboard draw branch returned before the popup loop.
- The object URL was revoked synchronously after `click()`, which can cancel downloads in Safari and Firefox.

**Round 2.** Junie fixed all three and refactored the popup drawing into a shared `drawPopups()` helper. Claude verified everything:
- the two-tap reset on screen;
- the warning colour and label fit;
- the confirmation message;
- the exact CSV output, including legacy entries without a date.

**Task 3, round by round: a QR code that has to actually scan**

The game is a single file with zero dependencies, and booths often have bad Wi-Fi. So we asked Junie to write a QR encoder from scratch. For verification, Claude rendered the matrix to a PNG and decoded it with OpenCV's `QRCodeDetector`. Unit tests passing was not enough; the code had to scan.

**Round 1.** Tests passed, but OpenCV decoded nothing. The matrix was 21×21 (version 1), which can't hold a 39-byte URL. Review found four problems:
- the capacity tables were level L, not M;
- overflow was never detected;
- the EC-level bits were wrong;
- the function-module mask was computed incorrectly.

**Round 2.** The size was now correct (29×29, version 3), but it still didn't scan. Claude wrote an independent reference encoder in Python, which OpenCV decodes, and compared the two matrices module by module:
- **All 70 of Junie's codewords** (data plus Reed–Solomon) **were byte-for-byte correct.**
- The failure was three placement bugs: a wrong format-info XOR constant (it must be `0x5412`), timing modules overwritten, and **one unreserved module at (7,8)** that shifted every later data bit by one.
- Claude verified the exact fix on a copy before handing it over.

**Round 3.** Junie applied the fix and added a regression test for the format bits. Then:
- OpenCV decodes `https://rodiagro-ui.github.io/wavemind/` from the engine output **and from screen captures of both QR placements**, even at half size.
- The small attract-mode QR overlapped the answer bars, so Claude reworked that layout into two columns: text on the left, QR on the right.

### The video, made by a pipeline
- **Gameplay.** Claude wrote a Playwright script that plays every scene by itself. It follows the game's own tutorial "hand", which always points at the next optimal move, and draws a visible finger on each tap.
- **Edit.** ffmpeg assembles the clips with English captions. The music is original: a pad built from the game's four answer notes (C, E, G, B).
- **Voice.** The author recorded the voice-over in one take. The pipeline cut it into 13 lines by detecting silences, cleaned the room echo and synced each scene to the length of its line.
- **Tempo.** After watching v1, the author asked for a faster cut. v4 runs at 1:04.
- **A real bug.** Recording found a bug that no test had caught. On the first animation frame the browser's timestamp can precede the start time, so game time briefly went negative and the album crashed on a negative canvas radius. It was fixed at the root (clamped `dt`), and we confirmed 0 page errors across 33 screen loads.

### Lessons about working with two agents
- **Tests guard the physics, not the pixels.** All three of Junie's rounds passed the 8 engine tests, yet two rounds still had visible bugs. The fix was a second agent that *looks at the screen*.
- **Specific reviews get specific fixes.** Feedback with exact coordinates and array indices was fixed on the first try every time.
- **Verify with an independent oracle.** For the QR code, "tests pass" meant nothing until a real decoder read it. A second, independent implementation found a one-module bug in minutes that the tests couldn't express.
- **The human stays the editor-in-chief.** The author decided what to build, routed the review between agents and approved the result. Neither AI merged its own work unchecked.

## Honest limits
- Most code was written by Claude Code. Junie joined later, once the JetBrains setup was ready.
- Simplifications are listed in-game ("The science" → "What we simplified").
