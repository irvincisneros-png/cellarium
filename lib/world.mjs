import * as cell from './game.mjs';
export {
  PARTS,
  EVENTS,
  capacities,
  upgradeCost,
  daylight,
  canGrow,
} from './game.mjs';
export const LEVELS = cell.LEVELS.map((l, i) => ({
  ...l,
  goal: [360, 480, 560, 680][i],
  bonusTime: [600, 780, 840, 960][i],
}));
export const CELLS = [
  {
    name: 'Sunward',
    tag: 'UPPER LEAF',
    description: 'A brighter position. Develop sugar production here.',
    light: 1.15,
    water: 0.88,
  },
  {
    name: 'Sheltered',
    tag: 'INNER LEAF',
    description: 'Gentler light and steadier water. A reliable reserve.',
    light: 0.8,
    water: 1.12,
  },
  {
    name: 'Outward',
    tag: 'OUTER LEAF',
    description: 'Balanced light, exposed to changing conditions.',
    light: 1,
    water: 1,
  },
];
const clone = (s) => structuredClone(s);
function pack(cells, selectedCell, notice) {
  const a = cells[selectedCell];
  return {
    ...a,
    version: 2,
    cells,
    selectedCell,
    growth: cells.reduce((n, c) => n + c.growth, 0),
    health: Math.min(...cells.map((c) => c.health)),
    notice: notice || a.notice,
  };
}
export function initialState(level = 0) {
  return pack(
    CELLS.map(() => cell.initialState(level)),
    0,
    'Three leaf cells. One plant. Help every cell contribute to your first harvest.',
  );
}
export function totalUpgrades(s) {
  return s.cells.reduce((n, c) => n + cell.totalUpgrades(c), 0);
}
export function contributors(s) {
  return s.cells.filter((c) => c.growth >= 40).length;
}
export function act(s, action, value) {
  if (s.status !== 'playing') return s;
  if (action === 'select') {
    const i = Number(value);
    return Number.isInteger(i) && i >= 0 && i < 3 ? pack(s.cells, i) : s;
  }
  const cells = clone(s.cells);
  let notice;
  if (action === 'event') {
    const i = s.selectedCell;
    const n = cell.act(cells[i], action, value);
    if (n === cells[i]) return s;
    cells[i] = n;
    for (let j = 0; j < 3; j++) {
      cells[j].event = null;
      cells[j].weather = clone(n.weather);
    }
    notice = n.notice;
  } else if (action === 'share') {
    const target = Number(value);
    const source = cells[s.selectedCell];
    if (
      !Number.isInteger(target) ||
      target < 0 ||
      target > 2 ||
      target === s.selectedCell ||
      source.sugar < 25 ||
      cells[target].sugar > 105
    )
      return s;
    source.sugar -= 20;
    cells[target].sugar += 20;
    notice = `20 sugar shared with ${CELLS[target].name}. Transport between cells is simplified here.`;
  } else {
    const n = cell.act(cells[s.selectedCell], action, value);
    if (n === cells[s.selectedCell]) return s;
    cells[s.selectedCell] = n;
    notice = n.notice;
  }
  return pack(cells, s.selectedCell, notice);
}
export function tick(s, dt = 1) {
  if (s.status !== 'playing' || s.event) return s;
  const cells = s.cells.map((c, i) => {
    const n = cell.tick({ ...c, nextEvent: Infinity }, dt);
    const r = cell.rates(c);
    const cap = cell.capacities(n);
    const delta = CELLS[i];
    n.sugar = Math.max(
      0,
      Math.min(cap.sugar, n.sugar + r.photo * (delta.light - 1) * dt),
    );
    n.water = Math.max(
      0,
      Math.min(cap.water, n.water + 0.35 * (delta.water - 1) * dt),
    );
    n.nextEvent = c.nextEvent; // world owns shared weather and victory
    if (n.status === 'won') {
      n.status = 'playing';
      n.notice = 'This cell is thriving. Keep supporting the whole plant.';
    }
    return n;
  });
  const n = pack(cells, s.selectedCell);
  const l = LEVELS[s.level];
  if (cells.some((c) => c.health <= 0)) {
    n.status = 'lost';
    cells.forEach((c) => (c.status = 'lost'));
    n.notice = 'One of your leaf cells lost its essential reserves.';
    return n;
  }
  if (
    n.growth >= l.goal &&
    n.t >= l.days * 90 &&
    totalUpgrades(n) >= 3 &&
    contributors(n) === 3 &&
    n.health >= 60
  ) {
    n.status = 'won';
    cells.forEach((c) => (c.status = 'won'));
    n.notice = 'Harvest ready. Three healthy cells helped your plant thrive.';
    return n;
  }
  if (n.t >= n.nextEvent) {
    const event = { index: (n.eventCount + n.level) % cell.EVENTS.length };
    cells.forEach((c) => {
      c.event = clone(event);
      c.eventCount++;
      c.nextEvent += 85;
    });
    return pack(cells, s.selectedCell);
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
      s.version !== 2 ||
      !Array.isArray(s.cells) ||
      s.cells.length !== 3 ||
      !Number.isInteger(s.selectedCell) ||
      s.selectedCell < 0 ||
      s.selectedCell > 2
    )
      return null;
    const cells = s.cells.map((c) => cell.restore(JSON.stringify(c)));
    if (
      cells.some((c) => !c) ||
      cells.some((c) => c.level !== cells[0].level || c.t !== cells[0].t)
    )
      return null;
    return pack(cells, s.selectedCell);
  } catch {
    return null;
  }
}

export function rates(s) {
  const r = cell.rates(s);
  const c = CELLS[s.selectedCell];
  return {
    ...r,
    photo: r.photo * c.light,
    sugar: r.sugar + r.photo * (c.light - 1),
    water: r.water + 0.35 * (c.water - 1),
  };
}
