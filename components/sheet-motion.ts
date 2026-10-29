'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { shouldDismissSheetSwipe } from '@/lib/sheet-gesture'

const EXIT_MS = 240
const DRAG_START_PX = 6 // finger travel before a touch counts as a sheet drag (keeps taps working)

type Drag = { pointerId: number; startY: number; startedAt: number; active: boolean }

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// On wider screens the sheet is a centered dialog, not a draggable bottom sheet.
const isDesktopLayout = () => typeof window !== 'undefined' && window.matchMedia?.('(min-width: 640px)').matches

/**
 * Motion for every bottom sheet (profile, reminders, your routine): ONE code path for all three.
 *
 * Why the heavier sheets stuttered on slower phones: the animation phase used to live in React
 * state, so every step (opening, open, closing, unmounted) re-rendered the whole sheet and all of
 * its content, in the middle of the animation. Now React renders a sheet only twice (mount and
 * unmount). Every animation step is applied straight to the DOM, so the slide itself is a pure
 * GPU transform with no JavaScript work, and the parent page is only told to close AFTER the
 * sheet is already off screen. Swipes continue from the exact finger position.
 */
export function useSheetMotion(open: boolean, onClose: () => void) {
  const [mounted, setMounted] = useState(open)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const exiting = useRef(false) // our own exit animation is running
  const exitTimer = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Follow the `open` prop.
  useEffect(() => {
    if (open) {
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current)
      exitTimer.current = null
      exiting.current = false
      const root = rootRef.current
      if (root) {
        // Re-opened while a previous exit was still on screen.
        root.removeAttribute('data-closing')
        root.dataset.state = 'open'
        panelRef.current?.style.removeProperty('transition')
        panelRef.current?.style.removeProperty('transform')
      }
      setMounted(true)
      return
    }

    if (exiting.current) {
      // The slide-out already played, so just unmount.
      exiting.current = false
      setMounted(false)
      return
    }

    // Closed by the parent (for example on sign-out): play the exit, then unmount.
    const root = rootRef.current
    if (!root) {
      setMounted(false)
      return
    }
    root.dataset.state = 'closing'
    const timer = window.setTimeout(() => setMounted(false), prefersReducedMotion() ? 0 : EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [open])

  // Right after the sheet is added to the page, start the slide-in (no React re-render involved).
  useEffect(() => {
    if (!mounted || !open) return
    const root = rootRef.current
    if (!root || root.dataset.state === 'open') return
    void root.offsetHeight // apply the "opening" styles first so the transition actually runs
    root.dataset.state = 'open'
  }, [mounted, open])

  useEffect(
    () => () => {
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current)
    },
    []
  )

  const close = useCallback(() => {
    if (exiting.current) return
    exiting.current = true
    const duration = prefersReducedMotion() ? 0 : EXIT_MS
    const panel = panelRef.current
    if (panel) {
      // Continues from wherever the sheet is now (resting, or mid-swipe).
      panel.style.transition = `transform ${duration}ms cubic-bezier(0.32, 0.72, 0, 1)`
      panel.style.transform = 'translate3d(0, 100%, 0)'
    }
    rootRef.current?.setAttribute('data-closing', 'true') // fades the backdrop through CSS
    exitTimer.current = window.setTimeout(() => {
      exitTimer.current = null
      onCloseRef.current()
    }, duration)
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (exiting.current || isDesktopLayout()) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    drag.current = { pointerId: event.pointerId, startY: event.clientY, startedAt: performance.now(), active: false }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const panel = panelRef.current
    if (!d || !panel || d.pointerId !== event.pointerId) return

    if (!d.active) {
      if (event.clientY - d.startY < DRAG_START_PX) return // a tap, or an upward move
      d.active = true
      d.startY = event.clientY
      d.startedAt = performance.now()
      panel.style.transition = 'none'
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // pointer already released
      }
    }
    panel.style.transform = `translate3d(0, ${Math.max(0, event.clientY - d.startY)}px, 0)`
  }

  const finishDrag = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d || d.pointerId !== event.pointerId) return
    drag.current = null
    if (!d.active) return

    const panel = panelRef.current
    const distance = Math.max(0, event.clientY - d.startY)
    const velocity = distance / Math.max(1, performance.now() - d.startedAt)
    if (!cancelled && shouldDismissSheetSwipe(distance, panel?.clientHeight ?? 0, velocity)) {
      close()
      return
    }
    // Not far enough: settle back to rest (the sheet's own CSS transition animates it).
    if (panel) {
      panel.style.removeProperty('transition')
      panel.style.removeProperty('transform')
    }
  }

  return {
    mounted,
    close,
    panelRef,
    // Spread onto the sheet's outer wrapper. data-state stays "opening" in React's eyes forever;
    // the hook flips the real DOM attribute itself, so React never re-renders for animation.
    rootProps: { ref: rootRef, 'data-state': 'opening', role: 'presentation' } as const,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => finishDrag(event, false),
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finishDrag(event, true),
    },
  }
}
