import { useRef, useEffect } from 'react';

export function useChessSounds() {
  const ctxRef = useRef(null);

  // Инициализация AudioContext по первому клику (обход блокировки автовоспроизведения)
  const initAudio = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
  };

  useEffect(() => {
    document.addEventListener('click', initAudio, { once: true });
    return () => ctxRef.current?.close();
  }, []);

  const play = (freq, type, duration, delay = 0) => {
    if (!ctxRef.current) return;
    const osc = ctxRef.current.createOscillator();
    const gain = ctxRef.current.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctxRef.current.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxRef.current.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctxRef.current.destination);
    osc.start(ctxRef.current.currentTime + delay);
    osc.stop(ctxRef.current.currentTime + delay + duration);
  };

  return {
    playMove: () => play(400, 'sine', 0.08),
    playCapture: () => { play(600, 'square', 0.06); play(900, 'sine', 0.1, 0.05); },
    playCheck: () => { play(880, 'sawtooth', 0.12); play(880, 'sawtooth', 0.12, 0.18); },
    playGameOver: () => { play(440, 'sine', 0.25); play(550, 'sine', 0.25, 0.3); play(660, 'sine', 0.4, 0.6); }
  };
}