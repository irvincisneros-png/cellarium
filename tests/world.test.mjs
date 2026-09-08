import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState,
  act,
  tick,
  totalUpgrades,
  contributors,
  LEVELS,
  canGrow,
  restore,
} from '../lib/world.mjs';
test('three cells retain independent resources and priorities', () => {
  let s = initialState();
  s = act(s, 'focus', 'produce');
  s = act(s, 'grow');
  s = act(s, 'select', '1');
  assert.equal(s.focus, 'balanced');
  assert.equal(s.sugar, 42);
  assert.equal(s.cells[0].sugar, 22);
  s = act(s, 'select', '0');
  assert.equal(s.focus, 'produce');
});
test('sharing sugar moves resources without creating them', () => {
  let s = initialState();
  s = act(s, 'share', '1');
  assert.equal(s.sugar, 22);
  assert.equal(s.cells[1].sugar, 62);
  assert.equal(act(s, 'share', '0'), s);
});
test('world save round-trip preserves all cells and rejects partial saves', () => {
  let s = act(initialState(), 'select', '2');
  assert.deepEqual(restore(JSON.stringify(s)), s);
  s.cells.pop();
  assert.equal(restore(JSON.stringify(s)), null);
});
test('all leaf cells must contribute before harvest can complete', () => {
  let s = initialState();
  s.cells.forEach((c) => {
    c.t = 300;
    c.nextEvent = 999;
    c.upgrades.membrane = 1;
  });
  s.cells[0].growth = 400;
  s = tick({ ...s, t: 300 });
  assert.equal(s.status, 'playing');
  s.cells[1].growth = 40;
  s.cells[2].growth = 40;
  s = tick(s);
  assert.equal(s.status, 'won');
});
for (let l = 0; l < 4; l++)
  test(`multi-cell chapter ${l + 1} reaches harvest with legal moves`, () => {
    let s = initialState(l);
    for (let sec = 0; sec < 2000 && s.status === 'playing'; sec++) {
      if (s.event) s = act(s, 'event', 'accept');
      for (let i = 0; i < 3; i++) {
        s = act(s, 'select', String(i));
        s = act(s, 'focus', s.water < 28 ? 'reserve' : 'produce');
        const c = s.cells[i];
        const part =
          c.upgrades.membrane < 1
            ? 'membrane'
            : c.upgrades.chloroplast < 1
              ? 'chloroplast'
              : null;
        if (part && s.sugar > 35 && s.energy > 35) s = act(s, 'upgrade', part);
        if (s.cells[i].health < 65 && s.sugar > 30 && s.energy > 35)
          s = act(s, 'repair');
        if (
          canGrow(s) &&
          s.sugar > 32 &&
          s.water > 25 &&
          s.energy > 30 &&
          c.upgrades.membrane >= 1 &&
          (s.growth < LEVELS[l].goal || c.growth < 40)
        )
          s = act(s, 'grow');
      }
      s = tick(s);
    }
    assert.equal(s.status, 'won', JSON.stringify(s));
    assert.equal(contributors(s), 3);
    assert.ok(totalUpgrades(s) >= 3);
    console.log(
      `World chapter ${l + 1}: ${s.t}s, ${s.growth} points, ${Math.round(s.health)} health`,
    );
  });
