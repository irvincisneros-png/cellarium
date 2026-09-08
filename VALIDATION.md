# Validation record

## Automated checks

- TypeScript check, correctness lint and production Vite build.
- 22 tests: individual-cell resource accounting, completed growth, night respiration, invalid actions, environment responses, loss and win conditions, save validation, sound scheduling and independent mute controls; independent cell pools, sugar sharing and multi-cell persistence; legal playthroughs of all four multi-cell scenarios.
- Baseline multi-cell strategy completes all four scenarios. Shaded conditions take longer without further chloroplast development; strategies and playback speed affect real play time.
- All objective gates are enforced: target points, three total developments, 40 points from each cell, minimum day, minimum health across every cell.
- npm audit: no known dependency vulnerabilities at the time of build.

## Browser verification

Verified during development: campaign entry, briefing, 3D rendering, plant/cell view switching, selecting structures, development actions, resource priorities, growth initiation, weather choices, save recovery after reload. Final deployed checks are recorded below after publishing.

## Limits

Simulation playthroughs are deterministic automated strategies, not a classroom efficacy study. Audio scheduling and mute behaviour are checked programmatically; perceived sound quality remains subjective. The art is illustrative and time/resource units are intentionally simplified.
