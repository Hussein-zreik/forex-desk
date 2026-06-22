// Lightweight WebAudio cue for price-alert hits — no audio asset needed.
// A gentle two-note "ding-dong" that respects the user's sound preference.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  return ctx
}

function tone(audio: AudioContext, freq: number, start: number, duration: number) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  // soft attack + exponential release so it reads as a chime, not a beep
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(audio.destination)
  osc.start(start)
  osc.stop(start + duration)
}

/** Play the price-alert chime. Safe to call from a browser event/poll. */
export function playAlertChime(): void {
  const audio = getCtx()
  if (!audio) return
  // Browsers start the context suspended until a user gesture; resume best-effort.
  if (audio.state === 'suspended') void audio.resume()
  const t = audio.currentTime
  tone(audio, 880, t, 0.18) // A5
  tone(audio, 1318.5, t + 0.16, 0.28) // E6
}
