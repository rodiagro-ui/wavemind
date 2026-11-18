# WAVEMIND

**Quantum computers don't guess. They cancel the wrong answers. Can you?**

▶ **Play it now: https://rodiagro-ui.github.io/wavemind/**

WAVEMIND is a quick, tap-to-play puzzle game about how quantum computers really "think". You rewire the cables of a quantum AI so that its wave cancels out on the false answers and builds up on the true one. It is built for the Cloud9 x JetBrains "Sky's the Limit" Hackathon 2026 (Category 3: Event Mini Game).

## How to play

- **Tap a cable** to connect or cut it. The wave flows from the **Q** core down to the answers.
- Cyan and pink are the same wave with opposite phase. Where a **crest meets a trough, they cancel**. A **π cable** flips the phase.
- 🔒 **Welded cables** can't be cut. You can only cancel them with interference.
- 🔥 **Hot neurons** scramble the wave (decoherence), so nothing interferes there.
- 👁 **Spy eyes** watch the path and break interference. Tap an eye to cover it.
- When the goal is met, the AI **measures**, and the answer lights up.
- 👁 **Colorblind mode** (title screen): π cables are drawn dashed and every lit cable shows a +/− sign, so phase never depends on colour alone.

## Modes

| Mode | For | What it is |
|---|---|---|
| **Arcade** | Event booth | A 75-second run with endless generated puzzles. Score comes from solving and from perfect (minimum-move) streaks. The run ends on a 3-letter arcade leaderboard with a **"Play at home" QR code** (generated in-game by a dependency-free QR encoder, so it works offline). Booth staff can export the day's scores as CSV and reset the board between event days. When nobody is playing, an **attract mode** plays itself. |
| **Story** | Players who want more | 5 chapters × 6 levels (Connections, Interference, Deep Networks, Noise, The Spy), unlocked with stars, plus a **final boss built on Grover's search algorithm**. Story levels have a **tap-to-preview, tap-to-confirm** control. |
| **Daily challenge** | Retention after the event | The same puzzle for everyone each day, with a Wordle-style shareable result. |
| **Quantum Album** | Story rewards | Every story level unlocks half of an animated collectible card about real quantum phenomena: the double slit, solar fusion tunnelling, entanglement, lasers, superconductors, GPS atomic clocks and more. |

## The physics (simplified, but honest)

- **Superposition:** a neuron splits its amplitude evenly over its active cables (a/√k), so total probability is conserved.
- **Phase:** a π cable multiplies the amplitude by −1.
- **Interference:** amplitudes add at every neuron, so +½ and −½ give 0.
- **Measurement:** P(answer) = |amplitude|² (Born rule), normalized over the outputs.
- **Decoherence:** hot neurons and open spy eyes tag the paths that pass through them. Paths with different tags add *probabilities*, not amplitudes, so they no longer interfere.

What we simplify: phases are only 0 or π, and merging cables is not strictly unitary, so we normalize at measurement. The in-game "The science" screen explains this.

Every generated level is checked by a brute-force solver. It guarantees the level can be solved, computes the minimum number of moves (used for stars and scoring), and makes interference or noise matter where the chapter requires it.

## Tests

```bash
npm test
```

The headless suite runs the real game script with a stubbed canvas. It checks exact destructive interference, Born-rule normalization, decoherence, the observer effect, Grover's 100% result, the solvability and determinism of all 30 story levels, the 75-second arcade run and translation coverage.

## Run it

It is a single HTML file with no build step and no dependencies. Open `index.html` in any modern browser, or serve the folder:

```bash
npx serve .
```

## Tools

- **JetBrains WebStorm** with **JetBrains Air**, driving the **Junie** coding agent (it built the colorblind mode). The two-agent workflow story is in [`AI_SHOWCASE.md`](AI_SHOWCASE.md).
- Claude Code (Anthropic) for design iteration, physics prototyping and testing
- Plain HTML5 Canvas + JavaScript, Web Audio API, Google Font *Space Grotesk*

## License

MIT. See [LICENSE](LICENSE).
