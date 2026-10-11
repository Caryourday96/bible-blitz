let context: AudioContext | null = null;
export function unlockAudio() {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
  } catch {
    /* Audio is optional. */
  }
}
export function tone(kind: 'tick' | 'correct' | 'wrong' | 'winner', volume: number) {
  if (!context || context.state !== 'running') return;
  const notes =
    kind === 'winner'
      ? [523, 659, 784, 1047]
      : kind === 'correct'
        ? [523, 784]
        : kind === 'wrong'
          ? [220, 164]
          : [440];
  notes.forEach((frequency, index) => {
    const oscillator = context!.createOscillator(),
      gain = context!.createGain(),
      at = context!.currentTime + index * 0.13;
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume * 0.15, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.2);
    oscillator.connect(gain);
    gain.connect(context!.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.22);
  });
}
export function startMusic(volume: number) {
  const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
  let index = 0;
  const timer = setInterval(() => {
    if (!context || context.state !== 'running') return;
    const osc = context.createOscillator(),
      gain = context.createGain(),
      at = context.currentTime;
    osc.frequency.value = notes[index++ % notes.length];
    gain.gain.setValueAtTime(volume * 0.025, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.5);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(at);
    osc.stop(at + 0.5);
  }, 450);
  return () => clearInterval(timer);
}
