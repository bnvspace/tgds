// ── Web Audio API 8-bit Synth ────────────────────────────────────────────────
// Deterministic sound generation for lightweight pixel-art aesthetics.

let audioCtx: AudioContext | null = null

function initContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
}

// Global mute state, bound to our game store but stored here for raw triggers
let IS_MUTED = false
export const setAudioMuted = (muted: boolean) => {
  IS_MUTED = muted
  if (muted && bgmInterval) {
    stopBGM()
  } else if (!muted && bgmInterval === null && bgmWasPlaying) {
    startBGM()
  }
}

// ── Generic beep generator ───────────────────────────────────────────────────
function beep(type: OscillatorType, frequency: number, duration: number, volume = 0.1) {
  if (IS_MUTED) return
  initContext()
  if (!audioCtx) return

  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime)

  // ADSR Envelope
  gain.gain.setValueAtTime(0, audioCtx.currentTime)
  gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration - 0.05)
  gain.gain.setValueAtTime(0, audioCtx.currentTime + duration)

  osc.connect(gain)
  gain.connect(audioCtx.destination)

  osc.start()
  osc.stop(audioCtx.currentTime + duration)
}

// ── SFX Library ─────────────────────────────────────────────────────────────

export function playCoinSFX() {
  if (IS_MUTED) return
  initContext()
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'square'
  
  // Coin pitch sequence: 987Hz (B5) -> 1318Hz (E6)
  osc.frequency.setValueAtTime(987, audioCtx.currentTime)
  osc.frequency.setValueAtTime(1318, audioCtx.currentTime + 0.1)

  gain.gain.setValueAtTime(0, audioCtx.currentTime)
  gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
  
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.3)
}

export function playHitSFX() {
  // Low dirty square wave for physical hits
  beep('sawtooth', 100, 0.2, 0.2)
  setTimeout(() => beep('square', 50, 0.2, 0.15), 50)
}

export function playMagicSFX() {
  if (IS_MUTED) return
  initContext()
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  
  // Ethereal sweep
  osc.frequency.setValueAtTime(600, audioCtx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1)
  osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.4)

  gain.gain.setValueAtTime(0, audioCtx.currentTime)
  gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4)

  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.4)
}

export function playHealSFX() {
  if (IS_MUTED) return
  initContext()
  if (!audioCtx) return
  // Ascending arpeggio
  const notes = [440, 554, 659, 880] // A4, C#5, E5, A5
  notes.forEach((freq, idx) => {
    // Cannot use beep() due to strict timing needed
    const osc = audioCtx!.createOscillator()
    const gain = audioCtx!.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    
    const startTime = audioCtx!.currentTime + idx * 0.08
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)

    osc.connect(gain)
    gain.connect(audioCtx!.destination)
    osc.start(startTime)
    osc.stop(startTime + 0.2)
  })
}

export function playShieldSFX() {
  // Low resonant thump
  beep('triangle', 120, 0.4, 0.3)
  setTimeout(() => beep('sine', 80, 0.4, 0.2), 30)
}

export function playErrorSFX() {
  // Negative buzzer
  beep('sawtooth', 150, 0.3, 0.1)
  setTimeout(() => beep('sawtooth', 100, 0.4, 0.1), 150)
}

export function playButtonSFX() {
  // Quick UI click — short square blip
  beep('square', 660, 0.06, 0.07)
}

// ── Background Music (Dark Fantasy 8-bit Loop) ─────────────────────────────

let bgmOscillator: OscillatorNode | null = null
let bgmGain: GainNode | null = null
let bgmInterval: ReturnType<typeof setInterval> | null = null
let bgmWasPlaying = false

const BASS_LINE = [
  55, 55, 65, 55, 73, 55, 65, 55,  // A1, A1, C2, A1, D2, A1, C2, A1
  61, 61, 73, 61, 82, 61, 73, 61   // B1, B1, D2, B1, E2, B1, D2, B1
]

export function startBGM() {
  bgmWasPlaying = true
  if (IS_MUTED) return
  initContext()
  if (!audioCtx || bgmInterval) return

  let step = 0
  
  bgmInterval = setInterval(() => {
    if (!audioCtx || IS_MUTED) return
    const freq = BASS_LINE[step % BASS_LINE.length]
    step++

    bgmOscillator = audioCtx.createOscillator()
    bgmGain = audioCtx.createGain()
    
    bgmOscillator.type = 'square'
    bgmOscillator.frequency.value = freq

    bgmGain.gain.setValueAtTime(0, audioCtx.currentTime)
    bgmGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.05) // low volume
    bgmGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)

    bgmOscillator.connect(bgmGain)
    bgmGain.connect(audioCtx.destination)

    bgmOscillator.start()
    bgmOscillator.stop(audioCtx.currentTime + 0.3)
  }, 350) // 171 BPM approx for 1/4th notes
}

export function stopBGM() {
  bgmWasPlaying = false
  if (bgmInterval) {
    clearInterval(bgmInterval)
    bgmInterval = null
  }
}

export function primeAudioPlayback() {
  initContext()
  if (!audioCtx || !bgmWasPlaying) return

  if (bgmInterval) {
    clearInterval(bgmInterval)
    bgmInterval = null
  }

  if (!IS_MUTED) {
    startBGM()
  }
}
