import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sound } from '../lib/audio.ts';
function fakeContext() {
  const oscillators = [];
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  return {
    state: 'running',
    currentTime: 0,
    oscillators,
    createGain: () => ({ gain: param(), connect() {}, disconnect() {} }),
    createOscillator() {
      const o = {
        frequency: param(),
        connect() {},
        disconnect() {},
        start() {
          this.started = true;
        },
        stop() {
          this.stopped = true;
        },
      };
      oscillators.push(o);
      return o;
    },
  };
}
test('sound effects create bounded oscillator voices; mute suppresses them', () => {
  const a = new Sound();
  a.ctx = fakeContext();
  a.master = a.ctx.createGain();
  a.musicBus = a.ctx.createGain();
  a.fx('win');
  assert.equal(a.ctx.oscillators.length, 5);
  assert.ok(a.ctx.oscillators.every((o) => o.started && o.stopped));
  a.effects = false;
  a.fx('grow');
  assert.equal(a.ctx.oscillators.length, 5);
});
test('soundtrack is separate from effects and stops scheduling when disabled', () => {
  const a = new Sound();
  a.ctx = fakeContext();
  a.master = a.ctx.createGain();
  a.musicBus = a.ctx.createGain();
  a.phrase();
  assert.equal(a.ctx.oscillators.length, 2);
  a.music = false;
  a.phrase();
  assert.equal(a.ctx.oscillators.length, 2);
  a.effects = true;
  a.fx('grow');
  assert.equal(a.ctx.oscillators.length, 5);
});
test('no audio context is a safe silent fallback', () => {
  const a = new Sound();
  assert.doesNotThrow(() => {
    a.fx('win');
    a.phrase();
    a.suspend();
    a.dispose();
  });
});
