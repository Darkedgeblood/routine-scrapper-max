'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

type SheetPhase = 'opening' | 'open' | 'closing'

const EXIT_MS = 240

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Bottom-sheet motion shared by every sheet (profile, reminders, your routine).
 *
 * Why closing used to stutter on slower phones: the moment you tapped close, the whole page
 * re-rendered (React state change) while the slide-out was starting, so the first frames of the
 * animation were dropped. Now the exit is started straight from the DOM (a pure transform
 * transition that runs on the GPU, with zero React work), and the parent is only told to close
 * AFTER the sheet is already off screen. Swipe-to-close continues from the exact finger position.
 */
export function useSheetMotion(open: boolean, onClose: () => void) {
  const [mounted, setMounted] = useState(open)
  const [phase, setPhase] = useState<SheetPhase>(open ? 'open' : 'opening')
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ pointerId: number; y: number } | null>(null)
  const exiting = useRef(false) // our own exit animation is running
  const exitTimer = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) {
      if (exiting.current) {
        // The slide-out already played, so unmount without any further animation.
        exiting.current = false
        setMounted(false)
        return
      }
      // Closed by the parent (e.g. signing out): play the exit, then unmount.
      setPhase('closing')
      const timer = window.setTimeout(() => setMounted(false), prefersReducedMotion() ? 0 : EXIT_MS)
      return () => window.clearTimeout(timer)
    }

    // (Re)opening, possibly while a previous exit was still finishing.
    if (exitTimer.current !== null) window.clearTimeout(exitTimer.current)
    exitTimer.current = null
    exiting.current = false
    rootRef.current?.removeAttribute('data-closing')
    if (panelRef.current) {
      panelRef.current.style.removeProperty('transition')
      panelRef.current.style.removeProperty('transform')
    }
    setMounted(true)
    setPhase('opening')
    const frame = window.requestAnimationFrame(() => setPhase('open'))
    return () => window.cancelAnimationFrame(frame)
  }, [open])

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
    if (exiting.current) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    dragStart.current = { pointerId: event.pointerId, y: event.clientY }
    if (panelRef.current) panelRef.current.style.transition = 'none'
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    if (!start || start.pointerId !== event.pointerId) return
    const distance = Math.max(0, event.clientY - start.y)
    if (panelRef.current) panelRef.current.style.transform = `translate3d(0, ${distance}px, 0)`
  }

  const finishDrag = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const start = dragStart.current
    if (!start || start.pointerId !== event.pointerId) return
    dragStart.current = null
    const distance = Math.max(0, event.clientY - start.y)
    const panel = panelRef.current
    const dismiss = !cancelled && distance > Math.max(96, (panel?.clientHeight ?? 0) * 0.2)
    if (dismiss) {
      close()
      return
    }
    // Not far enough: spring back to rest.
    if (panel) {
      panel.style.removeProperty('transition')
      panel.style.removeProperty('transform')
    }
  }

  return {
    mounted,
    phase,
    close,
    rootRef,
    panelRef,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => finishDrag(event, false),
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finishDrag(event, true),
    },
  }
}
