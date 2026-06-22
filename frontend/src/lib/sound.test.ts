import { afterEach, expect, test, vi } from 'vitest'
import { playAlertChime } from './sound'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('playAlertChime is a no-op (no throw) when AudioContext is unavailable', () => {
  vi.stubGlobal('AudioContext', undefined)
  vi.stubGlobal('webkitAudioContext', undefined)
  expect(() => playAlertChime()).not.toThrow()
})

test('playAlertChime schedules two oscillator tones when AudioContext exists', () => {
  const start = vi.fn()
  const stop = vi.fn()
  const createOscillator = vi.fn(() => ({
    type: '',
    frequency: { value: 0 },
    connect: vi.fn(() => ({ connect: vi.fn() })),
    start,
    stop,
  }))
  const createGain = vi.fn(() => ({
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(() => ({ connect: vi.fn() })),
  }))

  // Must be a real constructor (arrow fns can't be `new`-ed).
  class FakeCtx {
    state = 'running'
    currentTime = 0
    destination = {}
    resume = vi.fn()
    createOscillator = createOscillator
    createGain = createGain
  }
  vi.stubGlobal('AudioContext', FakeCtx)

  playAlertChime()

  // two notes => two oscillators, each started and stopped
  expect(createOscillator).toHaveBeenCalledTimes(2)
  expect(start).toHaveBeenCalledTimes(2)
  expect(stop).toHaveBeenCalledTimes(2)
})
