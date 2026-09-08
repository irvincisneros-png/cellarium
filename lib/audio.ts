// Original procedural soundtrack and effects. No external audio or tracking.
export class Sound {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  musicBus: GainNode | null = null;
  music = true;
  effects = true;
  timer: ReturnType<typeof setInterval> | null = null;
  beat = 0;
  async start() {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.28;
        this.master.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0.3;
        this.musicBus.connect(this.master);
      }
      await this.ctx.resume();
      if (!this.timer) this.timer = setInterval(() => this.phrase(), 900);
    } catch {
      /* Silent play remains available. */
    }
  }
  tone(
    f: number,
    length: number,
    vol = 0.12,
    type: OscillatorType = 'sine',
    delay = 0,
    music = false,
  ) {
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return;
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + length);
    o.connect(g);
    g.connect(music ? this.musicBus! : this.master);
    o.start(t);
    o.stop(t + length + 0.05);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  phrase() {
    if (!this.music) return;
    const notes = [
      130.81, 196, 261.63, 293.66, 329.63, 392, 329.63, 261.63, 146.83, 220,
      293.66, 329.63, 392, 440, 329.63, 293.66,
    ];
    const n = notes[this.beat++ % notes.length];
    this.tone(n, 2.5, 0.09, 'sine', 0, true);
    this.tone(n * 2, 1.4, 0.035, 'triangle', 0.3, true);
    if (this.beat % 4 === 0) this.tone(n / 2, 3, 0.12, 'sine', 0, true);
  }
  fx(kind: string) {
    if (!this.effects) return;
    const notes =
      kind === 'win'
        ? [261.63, 329.63, 392, 523.25, 659.25]
        : kind === 'grow'
          ? [329.63, 440, 659.25]
          : kind === 'alert'
            ? [293.66, 220]
            : kind === 'upgrade'
              ? [392, 493.88, 587.33]
              : [440, 554.37];
    notes.forEach((n, i) =>
      this.tone(n, kind === 'win' ? 1.2 : 0.35, 0.15, 'sine', i * 0.11),
    );
  }
  suspend() {
    void this.ctx?.suspend();
  }
  dispose() {
    if (this.timer) clearInterval(this.timer);
    void this.ctx?.close();
  }
}
