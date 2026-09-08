export const VERSION = 1;
export const LEVELS = [
  {
    name: 'First light',
    habitat: 'A sheltered leaf',
    description:
      'Learn the rhythm of a living cell. Build reserves in daylight and keep respiration going after dark.',
    goal: 180,
    bonusTime: 450,
    days: 3,
    water: 1,
    light: 1,
    reward: 'Seedling',
    color: '#b5ed80',
    briefing:
      'Grow to 180 points, develop 2 cell functions and reach day 4 with at least 60 health.',
  },
  {
    name: 'The dry spell',
    habitat: 'A sunlit leaf',
    description:
      'Water arrives more slowly. Develop your vacuole and slow photosynthesis when reserves get low.',
    goal: 240,
    bonusTime: 630,
    days: 4,
    water: 0.57,
    light: 1.15,
    reward: 'New leaves',
    color: '#f1cd7e',
    briefing:
      'Grow to 240 points, develop 2 cell functions and reach day 5 with at least 60 health.',
  },
  {
    name: 'Under the canopy',
    habitat: 'A shaded leaf',
    description:
      'Limited light means less sugar. Invest in chloroplast capacity and make every growth decision count.',
    goal: 280,
    bonusTime: 660,
    days: 4,
    water: 1.05,
    light: 0.59,
    reward: 'First flower',
    color: '#a4b6ff',
    briefing:
      'Grow to 280 points, develop 2 cell functions and reach day 5 with at least 60 health.',
  },
  {
    name: 'Weather the change',
    habitat: 'An exposed leaf',
    description:
      'Alternating shade and dry air test everything you have learned. Build a resilient cell to finish the campaign.',
    goal: 340,
    bonusTime: 750,
    days: 5,
    water: 0.8,
    light: 0.85,
    reward: 'Fruitful plant',
    color: '#ffa687',
    briefing:
      'Grow to 340 points, develop 2 cell functions and reach day 6 with at least 60 health.',
  },
];
export const PARTS = {
  chloroplast: {
    name: 'Chloroplast',
    tag: 'MAKE SUGAR',
    color: '#b2e76d',
    description:
      'Chloroplasts capture light energy to make sugars from water and carbon dioxide. Oxygen is released.',
    effect: 'More photosynthesis capacity in the light.',
    tip: 'In darkness, this process stops. Save sugar for the night.',
  },
  mitochondrion: {
    name: 'Mitochondrion',
    tag: 'RELEASE ENERGY',
    color: '#ffb580',
    description:
      'Mitochondria carry out much of aerobic respiration: energy from food is transferred into a usable form, ATP. Plant cells need them too.',
    effect: 'More usable energy from the available sugar.',
    tip: 'Respiration continues during both day and night. Oxygen supply is assumed in this model.',
  },
  vacuole: {
    name: 'Central vacuole',
    tag: 'STORE & SUPPORT',
    color: '#89daec',
    description:
      'The central vacuole contains cell sap. Water inside helps press the cell contents against the wall, keeping the cell firm.',
    effect: 'Larger water reserve and lower model water loss.',
    tip: 'The water meter represents available water, not pure water inside the vacuole.',
  },
  membrane: {
    name: 'Cell membrane',
    tag: 'CONTROL EXCHANGE',
    color: '#7ce7c0',
    description:
      'The cell membrane is selectively permeable: it controls the movement of substances into and out of the cell.',
    effect: 'Greater capacity to exchange resources with the surroundings.',
    tip: 'Water moves by osmosis. This game combines several transport processes into one supply rate.',
  },
  nucleus: {
    name: 'Nucleus',
    tag: 'HOLD INSTRUCTIONS',
    color: '#c5afff',
    description:
      'The nucleus contains most of the cell’s DNA: instructions used to make proteins and support cell activities.',
    effect: 'Contains instructions; it does not make decisions like a brain.',
    tip: 'Your management choices are a game abstraction. Cells do not consciously choose upgrades.',
  },
  wall: {
    name: 'Cell wall',
    tag: 'SUPPORT & PROTECT',
    color: '#dae8aa',
    description:
      'The cellulose-rich wall lies outside the membrane. It provides support and helps resist the pressure of the cell contents.',
    effect: 'Growth uses materials and energy to expand and maintain the cell.',
    tip: 'A real cell wall grows and is remodelled. It is not built one game tile at a time.',
  },
  cytoplasm: {
    name: 'Cytoplasm',
    tag: 'A LIVING WORKSPACE',
    color: '#aedfca',
    description:
      'The cytoplasm includes the fluid and structures between the membrane and nucleus. Many chemical reactions happen here.',
    effect: 'Links the cell’s activities together.',
    tip: 'This cutaway exaggerates spacing, colour and movement so you can see the structures.',
  },
};
export const EVENTS = [
  {
    title: 'A cloud passes',
    detail: 'Light will fall for 30 seconds. How will you prepare?',
    kind: 'cloud',
    choices: [
      {
        label: 'Use the reserves',
        text: 'Keep normal production. Light ×0.45.',
        value: 'accept',
      },
      {
        label: 'Conserve energy',
        text: 'Spend 8 energy to organise a lower-demand response.',
        value: 'adapt',
        cost: 8,
      },
    ],
  },
  {
    title: 'Dry air arrives',
    detail: 'Water supply will fall for 30 seconds.',
    kind: 'dry',
    choices: [
      {
        label: 'Ride it out',
        text: 'Keep normal demand. Water supply ×0.3.',
        value: 'accept',
      },
      {
        label: 'Protect the reserves',
        text: 'Spend 8 energy to reduce the impact.',
        value: 'adapt',
        cost: 8,
      },
    ],
  },
  {
    title: 'A repair opportunity',
    detail: 'Invest spare resources in maintenance, or save them for growth.',
    kind: 'repair',
    choices: [
      {
        label: 'Keep the reserves',
        text: 'No cost. Continue your strategy.',
        value: 'accept',
      },
      {
        label: 'Restore the cell',
        text: 'Spend 8 energy. Recover 18 health.',
        value: 'adapt',
        cost: 8,
      },
    ],
  },
];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function initialState(level = 0) {
  return {
    version: VERSION,
    level,
    t: 0,
    water: 72,
    sugar: 42,
    energy: 54,
    health: 100,
    growth: 0,
    upgrades: { chloroplast: 0, mitochondrion: 0, vacuole: 0, membrane: 0 },
    focus: 'balanced',
    job: null,
    status: 'playing',
    nextEvent: 45,
    eventCount: 0,
    event: null,
    weather: null,
    notice: 'Your cell is ready. Select a structure to explore it.',
    grows: 0,
    repairs: 0,
  };
}
export function daylight(s) {
  return s.t % 90 < 60;
}
export function capacities(s) {
  return { water: 110 + s.upgrades.vacuole * 35, sugar: 130, energy: 130 };
}
export function rates(s) {
  const l = LEVELS[s.level];
  let light = daylight(s) ? l.light : 0;
  let supply = l.water;
  if (s.level === 3) {
    if (Math.floor(s.t / 45) % 2) light *= 0.75;
    else supply *= 0.8;
  }
  if (s.weather?.kind === 'cloud') light *= 0.45;
  if (s.weather?.kind === 'dry') supply *= 0.3;
  const focus = s.focus === 'reserve' ? 0.52 : s.focus === 'produce' ? 1.38 : 1;
  const protection = s.weather?.kind === 'dry' && s.weather.adapted;
  const photo =
    s.water > 0.2
      ? 0.85 *
        light *
        (1 + s.upgrades.chloroplast * 0.4) *
        focus *
        (protection ? 0.6 : 1)
      : 0;
  const respiration =
    s.sugar > 0.2 ? 0.27 * (1 + s.upgrades.mitochondrion * 0.38) : 0;
  return {
    light,
    photo,
    respiration,
    water:
      0.87 * supply * (1 + s.upgrades.membrane * 0.28) -
      photo * 0.45 -
      (protection ? 0.02 : 0.16) / (1 + s.upgrades.vacuole * 0.5),
    sugar: photo - respiration,
    energy:
      respiration * 4.1 -
      (s.weather?.kind === 'cloud' && s.weather.adapted ? 0.2 : 0.43),
  };
}
export function upgradeCost(s, part) {
  const n = s.upgrades[part];
  return { sugar: 24 + n * 14, energy: 22 + n * 12 };
}
export function totalUpgrades(s) {
  return Object.values(s.upgrades).reduce((a, b) => a + b, 0);
}
export function canGrow(s) {
  return (
    s.status === 'playing' &&
    !s.job &&
    s.sugar >= 20 &&
    s.energy >= 18 &&
    s.water >= 12 &&
    s.health >= 35
  );
}
export function act(s, action, value) {
  if (s.status !== 'playing') return s;
  const n = structuredClone(s);
  if (action === 'focus' && ['balanced', 'reserve', 'produce'].includes(value))
    n.focus = value;
  else if (action === 'grow' && canGrow(s)) {
    n.sugar -= 20;
    n.energy -= 18;
    n.water -= 12;
    n.job = { type: 'grow', remaining: 12 };
    n.notice =
      'Growth underway. Sugar supplies building materials; energy supports the work.';
  } else if (
    action === 'upgrade' &&
    Object.hasOwn(n.upgrades, value) &&
    n.upgrades[value] < 3
  ) {
    const cost = upgradeCost(s, value);
    if (n.sugar < cost.sugar || n.energy < cost.energy) return s;
    n.sugar -= cost.sugar;
    n.energy -= cost.energy;
    n.upgrades[value]++;
    n.notice =
      PARTS[value].name +
      ' capacity developed. This upgrade represents biological development.';
  } else if (
    action === 'repair' &&
    n.sugar >= 12 &&
    n.energy >= 14 &&
    n.health < 100
  ) {
    n.sugar -= 12;
    n.energy -= 14;
    n.health = clamp(n.health + 25, 0, 100);
    n.repairs++;
    n.notice = 'Maintenance complete. Health restored.';
  } else if (
    action === 'event' &&
    n.event &&
    ['adapt', 'accept'].includes(value)
  ) {
    const e = EVENTS[n.event.index];
    if (value === 'adapt' && n.energy < 8) return s;
    if (value === 'adapt') n.energy -= 8;
    if (e.kind === 'repair') {
      if (value === 'adapt') n.health = clamp(n.health + 18, 0, 100);
    } else
      n.weather = { kind: e.kind, adapted: value === 'adapt', until: n.t + 30 };
    n.notice =
      value === 'adapt'
        ? 'Response prepared. Watch the resource rates.'
        : 'Reserves committed. Keep an eye on your cell.';
    n.event = null;
  } else return s;
  return n;
}
export function tick(s, dt = 1) {
  if (s.status !== 'playing' || s.event) return s;
  const n = structuredClone(s);
  const r = rates(s);
  const cap = capacities(s);
  dt = clamp(dt, 0, 1);
  n.t += dt;
  for (const k of ['water', 'sugar', 'energy'])
    n[k] = clamp(n[k] + r[k] * dt, 0, cap[k]);
  const stressed = n.water < 5 || n.sugar < 2 || n.energy < 2;
  n.health = clamp(n.health + (stressed ? -0.9 : 0.12) * dt, 0, 100);
  if (n.job) {
    n.job.remaining -= dt;
    if (n.job.remaining <= 0) {
      n.growth += 20;
      n.grows++;
      n.job = null;
      n.notice = '+20 growth points. Your cell has grown.';
    }
  }
  if (n.weather && n.t >= n.weather.until) n.weather = null;
  if (n.health <= 0) {
    n.status = 'lost';
    n.notice =
      'The cell ran out of essential resources. Try a different balance.';
    return n;
  }
  const l = LEVELS[n.level];
  if (
    n.growth >= l.goal &&
    n.t >= l.days * 90 &&
    totalUpgrades(n) >= 2 &&
    n.health >= 60
  ) {
    n.status = 'won';
    n.notice = 'Scenario complete!';
    return n;
  }
  if (n.t >= n.nextEvent) {
    n.event = { index: (n.eventCount + n.level) % EVENTS.length };
    n.eventCount++;
    n.nextEvent += 85;
  }
  return n;
}
export function stars(s) {
  return (
    1 + (s.health >= 85 ? 1 : 0) + (s.t <= LEVELS[s.level].bonusTime ? 1 : 0)
  );
}
export function restore(raw) {
  try {
    const s = JSON.parse(raw);
    if (
      !s ||
      s.version !== VERSION ||
      !Number.isInteger(s.level) ||
      !LEVELS[s.level]
    )
      return null;
    if (
      !['playing', 'won', 'lost'].includes(s.status) ||
      !['balanced', 'reserve', 'produce'].includes(s.focus)
    )
      return null;
    for (const k of [
      't',
      'water',
      'sugar',
      'energy',
      'health',
      'growth',
      'nextEvent',
      'eventCount',
      'grows',
      'repairs',
    ])
      if (!Number.isFinite(s[k]) || s[k] < 0) return null;
    for (const k of ['chloroplast', 'mitochondrion', 'vacuole', 'membrane'])
      if (
        !Number.isInteger(s.upgrades?.[k]) ||
        s.upgrades[k] < 0 ||
        s.upgrades[k] > 3
      )
        return null;
    if (s.event && (!Number.isInteger(s.event.index) || !EVENTS[s.event.index]))
      return null;
    if (
      s.job &&
      (s.job.type !== 'grow' ||
        !Number.isFinite(s.job.remaining) ||
        s.job.remaining < 0 ||
        s.job.remaining > 12)
    )
      return null;
    if (
      s.weather &&
      (!['cloud', 'dry'].includes(s.weather.kind) ||
        !Number.isFinite(s.weather.until))
    )
      return null;
    if (
      s.health > 100 ||
      s.water > capacities(s).water ||
      s.sugar > 130 ||
      s.energy > 130
    )
      return null;
    return s;
  } catch {
    return null;
  }
}
