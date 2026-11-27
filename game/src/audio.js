// audio.js — all sound is synthesized with WebAudio, no audio files.
// A small helper builds short blips and jingles: flap, corn pickup,
// stumble, the farmer's shout, caught, and the escape fanfare.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    flap() {
      tone(520, 0.09, 'sine', 0.16, 0, 780);
    },
    jump() {
      tone(300, 0.12, 'triangle', 0.18, 0, 620);
    },
    corn() {
      tone(880, 0.07, 'sine', 0.16);
      tone(1320, 0.09, 'sine', 0.14, 0.06);
    },
    golden() {
      tone(660, 0.08, 'sine', 0.18);
      tone(880, 0.08, 'sine', 0.18, 0.07);
      tone(1320, 0.12, 'sine', 0.18, 0.14);
    },
    stumble() {
      tone(180, 0.18, 'sawtooth', 0.20, 0, 90);
    },
    shout() {
      tone(220, 0.10, 'square', 0.10, 0, 160);
      tone(220, 0.10, 'square', 0.10, 0.13, 160);
    },
    stage() {
      tone(523, 0.10, 'triangle', 0.16);
      tone(659, 0.10, 'triangle', 0.16, 0.09);
      tone(784, 0.16, 'triangle', 0.16, 0.18);
    },
    caught() {
      tone(392, 0.16, 'sawtooth', 0.18);
      tone(311, 0.16, 'sawtooth', 0.18, 0.15);
      tone(233, 0.30, 'sawtooth', 0.18, 0.30);
    },
    escaped() {
      const notes = [523, 659, 784, 1047, 784, 1047];
      notes.forEach((n, i) => tone(n, 0.14, 'triangle', 0.18, i * 0.11));
    },
  };
}
