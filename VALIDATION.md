# Validation record

## Automated checks

- TypeScript check, correctness lint and production Vite build.
- 22 tests: individual-cell resource accounting, completed growth, night respiration, invalid actions, environment responses, loss and win conditions, save validation, sound scheduling and independent mute controls; independent cell pools, sugar sharing and multi-cell persistence; legal playthroughs of all four multi-cell scenarios.
- Baseline multi-cell strategy completes all four scenarios. Shaded conditions take longer without further chloroplast development; strategies and playback speed affect real play time.
- All objective gates are enforced: target points, three total developments, 40 points from each cell, minimum day, minimum health across every cell.
- npm audit: no known dependency vulnerabilities at the time of build.

## Browser verification

Verified during development: campaign entry, briefing, 3D rendering, plant/cell view switching, selecting structures, development actions, resource priorities, growth initiation, weather choices, save recovery after reload. A complete first-chapter browser playthrough reached 360 points, 100% health and three stars in 8:06 game time; the next-chapter briefing opened successfully. Responsive checks at 390px confirmed no horizontal overflow and access to all controls through vertical scrolling. Both audio switches were toggled, read back and restored. The optional read-only inspection tool returned game state and rejected invalid input.

## Limits

Simulation playthroughs are deterministic automated strategies, not a classroom efficacy study. Audio scheduling and mute behaviour are checked programmatically; perceived sound quality remains subjective. The art is illustrative and time/resource units are intentionally simplified.

## Published checks

GitHub Actions passed installation, typecheck, lint, tests, build and Pages deployment. The live root, JavaScript, CSS and both ImageGen backgrounds returned HTTP 200 from the repository subpath.

## Guided tutorial update (9 September 2026)

- Added two tests covering the complete practice sequence, sufficient resources for each action, no weather interruptions, stage-specific action guards and the three running-clock stages. All 24 tests pass.
- Completed every tutorial step in the browser, including both 12-second growth jobs, switching to Sheltered and returning to the plant. Completion restored the campaign with its existing chapter and three stars.
- A development reload during practice recovered the untouched campaign rather than saving the practice cell. Tutorial can be replayed or exited from the header/coach.
- Phone-size browser check at 390px confirmed the coach does not cover the Plant/Cell toggle and the highlighted upgrade is scrolled into view. Early exit restored the campaign as well.
