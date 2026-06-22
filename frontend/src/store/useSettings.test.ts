import { expect, test } from 'vitest'
import { useSettings } from './useSettings'

test('sound is enabled by default and toggles', () => {
  useSettings.setState({ soundEnabled: true })
  expect(useSettings.getState().soundEnabled).toBe(true)
  useSettings.getState().toggleSound()
  expect(useSettings.getState().soundEnabled).toBe(false)
  useSettings.getState().toggleSound()
  expect(useSettings.getState().soundEnabled).toBe(true)
})

test('theme toggles between light and dark', () => {
  useSettings.setState({ theme: 'dark' })
  useSettings.getState().toggleTheme()
  expect(useSettings.getState().theme).toBe('light')
})
