import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TUTORIAL,
  nextTutorialStep,
  tutorialAllows,
} from '../lib/tutorial.mjs';
import { initialState, act, tick } from '../lib/world.mjs';
test('guided practice completes with affordable actions before weather events', () => {
  let s = initialState(),
    step = 1,
    view = 'cell';
  step = nextTutorialStep(step, s, view);
  assert.equal(step, 2);
  assert.equal(nextTutorialStep(step, s, view), 2);
  s = act(s, 'upgrade', 'chloroplast');
  step = nextTutorialStep(step, s, view);
  assert.equal(step, 3);
  s = act(s, 'focus', 'produce');
  step = nextTutorialStep(step, s, view);
  assert.equal(step, 4);
  while (nextTutorialStep(step, s, view) === step) s = tick(s, 0.25);
  step = 5;
  assert.ok(s.sugar >= 32);
  s = act(s, 'grow');
  step = nextTutorialStep(step, s, view);
  assert.equal(step, 6);
  while (nextTutorialStep(step, s, view) === step) s = tick(s, 0.25);
  step = 7;
  assert.equal(nextTutorialStep(step, s, view), 7);
  s = act(s, 'select', '1');
  step = nextTutorialStep(step, s, view);
  assert.equal(step, 8);
  s = act(s, 'grow');
  step = nextTutorialStep(step, s, view);
  assert.equal(step, 9);
  while (nextTutorialStep(step, s, view) === step) s = tick(s, 0.25);
  step = 10;
  assert.equal(nextTutorialStep(step, s, view), 10);
  assert.equal(nextTutorialStep(step, s, 'plant'), 11);
  assert.equal(s.growth, 40);
  assert.equal(s.event, null);
  assert.ok(s.t < 45);
});
test('reading stages freeze time and practice only allows the requested action', () => {
  assert.deepEqual(
    TUTORIAL.flatMap((s, i) => (s.running ? [i] : [])),
    [4, 6, 9],
  );
  assert.equal(tutorialAllows(2, 'grow'), false);
  assert.equal(tutorialAllows(2, 'upgrade', 'membrane'), false);
  assert.equal(tutorialAllows(2, 'upgrade', 'chloroplast'), true);
  assert.equal(tutorialAllows(3, 'focus', 'produce'), true);
  assert.equal(tutorialAllows(4, 'grow'), false);
  assert.equal(tutorialAllows(5, 'grow'), true);
  assert.equal(tutorialAllows(null, 'share', '1'), true);
});
