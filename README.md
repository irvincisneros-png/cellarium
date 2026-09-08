# Cellarium

A single-player 3D plant-cell management game for introductory secondary science. Built for Irvin Cisneros. An original game inspired by the resource-management idea of Cellulose, not an adaptation of its rules, artwork or text.

## Play

[Open Cellarium](https://irvincisneros-png.github.io/cellarium/).

Develop cell capacities, balance sugar, water and usable energy, and invest in growth. Each growth action earns 20 points. Win by meeting the scenario's growth target, completing three capacity developments, contributing at least 40 points from each of three independent leaf cells, reaching its minimum day and retaining at least 60 health in every cell. A zero-health cell ends the attempt with tailored recovery advice.

| Chapter            | Growth target | Minimum day | Time-bonus threshold |
| ------------------ | ------------- | ----------- | -------------------- |
| First light        | 360           | 4           | 10:00                |
| The dry spell      | 480           | 5           | 13:00                |
| Under the canopy   | 560           | 5           | 14:00                |
| Weather the change | 680           | 6           | 16:00                |

One day is 90 game seconds (60 light, 30 dark). Optional 2× playback accelerates the simulation, not the score clock. Stars: one for completion, one for 85+ final health, one for meeting the time bonus. Chapters unlock sequentially; replay to improve stars. The 3D tomato plant visibly develops leaves, flowers and ripening fruit during each scenario. Each successful harvest unlocks a new environment.

Drag to orbit; scroll to zoom. All structures also have keyboard-accessible buttons. Space pauses, G grows. The field guide, settings and environmental decisions pause play. Switching tabs also pauses. The original procedural soundtrack and effects have separate controls; audio begins after a player gesture. Fonts, geometry and code are bundled; no remote media, analytics or account services.

## Educational model

The model represents three photosynthetic **leaf cells**, not every type of plant cell. They stand for the many cells of a whole plant. Sunward, Sheltered and Outward positions have distinct light and water conditions. Sugar sharing models transport between cells in a deliberately simplified way. Essential cell structures are present from the beginning. Development represents capacity changes, not purchasing missing organs. The nucleus stores instructions; it does not consciously direct choices. Chloroplasts make sugar using light, water and carbon dioxide. Mitochondria support respiration both day and night. The vacuole represents cell-sap storage and turgor; the wall sits outside a separate membrane.

Resources are game units, not molecular stoichiometry. Carbon dioxide, oxygen, mineral supplies, biochemical pathways and whole-plant transport are simplified. Colour, timing, scale and motion are illustrative. The player's priorities and response choices are explicit management abstractions. A fruit is a whole-plant milestone, never a product of one cell. This is a teaching game, not a quantitative physiology simulator.

Sources: [OpenStax cell structures](https://openstax.org/books/concepts-biology/pages/3-3-eukaryotic-cells), [OpenStax photosynthesis](https://openstax.org/books/concepts-biology/pages/5-1-overview-of-photosynthesis).

## Run and validate

Requires Node 22.18+ (the audio tests use Node's native TypeScript stripping).

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

- `lib/game.mjs`: deterministic individual-cell simulation and save validation.
- `lib/world.mjs`: three independent cells, shared weather, sugar sharing, harvest objectives and multi-cell saves.
- `app/PlantScene.tsx`: a growing 3D tomato plant with leaf veins, soil, label, flowers and fruit.
- `public/art/`: original ImageGen greenhouse and microscopic leaf-tissue backgrounds, optimised for browser delivery.
- `app/page.tsx`: campaign, controls, field guide, progression and local saves.
- `app/CellScene.tsx`: original Three.js cell cutaway with an interactive orbit camera and non-WebGL fallback.
- `lib/audio.ts`: original Web Audio soundtrack and sound effects.
- `tests/`: resource rules, win/loss gates, all-scenario legal playthroughs, save validation and audio scheduling/mute checks.

Progress is stored in this browser's local storage, not synced across devices. Clearing site data removes saves. The game runs no offline/background catch-up. `inspect_cell` is an optional read-only WebMCP tool; it exposes only this game's state.

## Publishing

GitHub Pages serves the static Vite build. Relative asset URLs support repository-subpath hosting. The workflow runs type checking, lint, tests and build before deployment. The initial generated server scaffold was replaced with a static entry point because the requested destination is GitHub Pages; unused server packages were removed. No server runtime or credentials ship to the browser.

The greenhouse and leaf-tissue backgrounds were generated with OpenAI ImageGen on 8 September 2026 specifically for this game. They provide artistic atmosphere, not authoritative microscopy. Cell and plant geometry, interface illustration and audio are authored for this project. Dependencies and bundled fonts retain their own licences.
