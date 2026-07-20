import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

interface UseMenuOptions {
  /**
   * 'menu'   — roving focus over [role="menuitem"] with Arrow/Home/End; the
   *            first item is focused on open (Settings dropdown, watchlist).
   * 'dialog' — a popover that owns arbitrary focusables (inputs, selects); the
   *            first focusable is focused on open (add-widget search box).
   * Both modes trap Tab within the surface and close on Escape / outside click,
   * returning focus to the trigger on keyboard dismissal.
   */
  mode?: 'menu' | 'dialog'
}

/**
 * Accessible open/close behaviour shared by the app's dropdown menus:
 * outside-click + Escape to dismiss, focus return to the trigger, a Tab focus
 * trap, and (in 'menu' mode) arrow-key roving over the items.
 */
export function useMenu({ mode = 'menu' }: UseMenuOptions = {}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const dismiss = useCallback((returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  const items = useCallback((): HTMLElement[] => {
    const root = rootRef.current
    if (!root) return []
    // Menus render their items only while open, so everything matched is live —
    // no visibility filter needed (and offsetParent is unreliable under jsdom).
    const selector = mode === 'menu' ? '[role="menuitem"]:not([aria-disabled="true"])' : FOCUSABLE
    return Array.from(root.querySelectorAll<HTMLElement>(selector))
  }, [mode])

  // Outside pointer-down closes (focus follows the pointer, so no focus return).
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // On open, move focus onto the surface (first item / first focusable). The
  // surface is already committed to the DOM when this effect runs.
  useEffect(() => {
    if (open) items()[0]?.focus()
  }, [open, items])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismiss(true)
        return
      }
      const list = items()
      if (list.length === 0) return
      const idx = list.indexOf(document.activeElement as HTMLElement)

      const focusAt = (i: number) => {
        e.preventDefault()
        list[(i + list.length) % list.length]?.focus()
      }

      if (e.key === 'Tab') {
        // Trap Tab within the surface (cycles instead of leaving).
        focusAt(e.shiftKey ? idx - 1 : idx + 1)
        return
      }
      if (mode !== 'menu') return
      switch (e.key) {
        case 'ArrowDown':
          focusAt(idx + 1)
          break
        case 'ArrowUp':
          focusAt(idx - 1)
          break
        case 'Home':
          focusAt(0)
          break
        case 'End':
          focusAt(list.length - 1)
          break
      }
    },
    [items, dismiss, mode],
  )

  return {
    open,
    setOpen,
    /** Toggle from the trigger button. */
    toggle: useCallback(() => setOpen((v) => !v), []),
    /** Close without returning focus (e.g. after activating an item). */
    close: useCallback(() => setOpen(false), []),
    rootRef,
    triggerRef,
    /** Spread onto the surface element (adds role in 'menu' mode + key handling). */
    surfaceProps: {
      ...(mode === 'menu' ? { role: 'menu' as const } : {}),
      onKeyDown,
    },
  }
}
