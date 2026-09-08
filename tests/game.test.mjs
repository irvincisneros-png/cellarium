import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState,
  act,
  tick,
  rates,
  LEVELS,
  canGrow,
  totalUpgrades,
  restore,
  stars,
} from '../lib/game.mjs';
test('growth pays once, completes after 12 seconds and cannot queue duplicates', () => {
  let s = initialState();
  s = act(s, 'grow');
  assert.equal(s.sugar, 22);
  assert.equal(act(s, 'grow'), s);
  for (let i = 0; i < 12; i++) s = tick(s);
  assert.equal(s.growth, 20);
  assert.equal(s.job, null);
});
test('night stops photosynthesis while respiration continues', () => {
  const s = initialState();
  s.t = 65;
  assert.equal(rates(s).photo, 0);
  assert.ok(rates(s).respiration > 0);
});
test('insufficient resources and invalid actions do not mutate the cell', () => {
  const s = initialState();
  s.energy = 0;
  assert.equal(act(s, 'grow'), s);
  assert.equal(act(s, 'upgrade', 'nucleus'), s);
  assert.equal(act(s, 'focus', 'bogus'), s);
  assert.equal(act(s, 'upgrade', 'membrane'), s);
});
test('scenario choice pauses the clock and consumes response cost once', () => {
  let s = initialState();
  s.event = { index: 0 };
  assert.equal(tick(s), s);
  s = act(s, 'event', 'adapt');
  assert.equal(s.energy, 46);
  assert.equal(s.event, null);
  assert.equal(s.weather.adapted, true);
  assert.equal(act(s, 'event', 'adapt'), s);
});
test('zero essential resources causes a loss; terminal states freeze', () => {
  let s = initialState();
  s.t = 62;
  s.sugar = 0;
  s.energy = 0;
  s.health = 0.1;
  s = tick(s);
  assert.equal(s.status, 'lost');
  assert.equal(tick(s), s);
  assert.equal(act(s, 'grow'), s);
});
test('all objectives required before victory', () => {
  let s = initialState();
  s.growth = 180;
  s.t = 271;
  s.nextEvent = 999;
  s = tick(s);
  assert.equal(s.status, 'playing');
  s.upgrades.chloroplast = 2;
  s.health = 30;
  s = tick(s);
  assert.equal(s.status, 'playing');
  s.health = 90;
  s = tick(s);
  assert.equal(s.status, 'won');
  assert.equal(stars(s), 3);
});
test('save validation rejects corrupt, partial and out-of-range state', () => {
  assert.equal(restore('{'), null);
  assert.equal(restore('{}'), null);
  const s = initialState();
  assert.deepEqual(restore(JSON.stringify(s)), s);
  s.upgrades.vacuole = 99;
  assert.equal(restore(JSON.stringify(s)), null);
});
function play(level) {
  let s = initialState(level);
  for (let i = 0; i < 1800 && s.status === 'playing'; i++) {
    if (s.event) s = act(s, 'event', s.energy > 35 ? 'adapt' : 'accept');
    s = act(s, 'focus', s.water < 28 ? 'reserve' : 'produce');
    const plan =
      level === 2
        ? ['chloroplast', 'chloroplast', 'mitochondrion', 'membrane']
        : ['chloroplast', 'membrane', 'mitochondrion', 'vacuole'];
    const next = plan.find(
      (p, idx) =>
        s.upgrades[p] < plan.slice(0, idx + 1).filter((x) => x === p).length,
    );
    if (next && s.sugar > 38 && s.energy > 38) s = act(s, 'upgrade', next);
    if (s.health < 65 && s.energy > 35 && s.sugar > 30) s = act(s, 'repair');
    if (
      canGrow(s) &&
      s.sugar > 35 &&
      s.water > 27 &&
      s.energy > 35 &&
      totalUpgrades(s) >= 2 &&
      s.growth < LEVELS[level].goal
    )
      s = act(s, 'grow');
    s = tick(s);
  }
  return s;
}
for (let i = 0; i < 4; i++)
  test(`scenario ${i + 1} can be won through legal resource decisions`, () => {
    const s = play(i);
    assert.equal(s.status, 'won', JSON.stringify(s));
    assert.ok(s.t < 1200);
    console.log(
      `${LEVELS[i].name}: ${Math.round(s.t)}s, ${Math.round(s.health)} health, ${stars(s)} stars`,
    );
  });
