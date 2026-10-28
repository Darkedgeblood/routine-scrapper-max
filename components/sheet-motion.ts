'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { shouldDismissSheetSwipe } from '@/lib/sheet-gesture'

type SheetPhase = 'opening' | 'open' | 'closing'

const EXIT_MS = 240
const SWIPE_RETURN_MS = 240

type SheetMotionOptions = {
  /** Use frame-synced dragging and a smooth settle-back for swipe gestures. */
  smoothSwipe?: boolean
}

type DragStart = {
  pointerId: number
  y: number
  startedAt: number
  offsetY: number
}

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
export function useSheetMotion(open: boolean, onClose: () => void, options: SheetMotionOptions = {}) {
  const smoothSwipe = options.smoothSwipe ?? false
  const [mounted, setMounted] = useState(open)
  const [phase, setPhase] = useState<SheetPhase>(open ? 'open' : 'opening')
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<DragStart | null>(null)
  const dragFrame = useRef<number | null>(null)
  const pendingDragOffset = useRef<number | null>(null)
  const exiting = useRef(false) // our own exit animation is running
  const exitTimer = useRef<number | null>(null)
  const swipeReturnTimer = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (dragFrame.current !== null) window.cancelAnimationFrame(dragFrame.current)
    dragFrame.current = null
    pendingDragOffset.current = null

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
    if (swipeReturnTimer.current !== null) window.clearTimeout(swipeReturnTimer.current)
    exitTimer.current = null
    swipeReturnTimer.current = null
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
      if (swipeReturnTimer.current !== null) window.clearTimeout(swipeReturnTimer.current)
      if (dragFrame.current !== null) window.cancelAnimationFrame(dragFrame.current)
    },
    []
  )

  const close = useCallback(() => {
    if (exiting.current) return
    exiting.current = true
    if (swipeReturnTimer.current !== null) {
      window.clearTimeout(swipeReturnTimer.current)
      swipeReturnTimer.current = null
    }
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
    const panel = panelRef.current
    let offsetY = 0
    if (smoothSwipe && panel) {
      const transform = window.getComputedStyle(panel).transform
      const values = transform.startsWith('matrix3d(')
        ? transform.slice(9, -1).split(',')
        : transform.startsWith('matrix(')
          ? transform.slice(7, -1).split(',')
          : []
      const translateY = values.length === 16 ? values[13] : values.length === 6 ? values[5] : '0'
      offsetY = Math.max(0, Number(translateY) || 0)
      if (swipeReturnTimer.current !== null) {
        window.clearTimeout(swipeReturnTimer.current)
        swipeReturnTimer.current = null
      }
    }
    dragStart.current = { pointerId: event.pointerId, y: event.clientY, startedAt: performance.now(), offsetY }
    if (panel) {
      panel.style.transition = 'none'
      if (smoothSwipe) panel.style.transform = `translate3d(0, ${offsetY}px, 0)`
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    if (!start || start.pointerId !== event.pointerId) return
    const distance = Math.max(0, start.offsetY + event.clientY - start.y)
    const panel = panelRef.current
    if (!panel) return

    if (!smoothSwipe) {
      panel.style.transform = `translate3d(0, ${distance}px, 0)`
      return
    }

    pendingDragOffset.current = distance
    if (dragFrame.current !== null) return
    dragFrame.current = window.requestAnimationFrame(() => {
      dragFrame.current = null
      const offset = pendingDragOffset.current
      pendingDragOffset.current = null
      if (offset !== null && panelRef.current) {
        panelRef.current.style.transform = `translate3d(0, ${offset}px, 0)`
      }
    })
  }

  const finishDrag = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const start = dragStart.current
    if (!start || start.pointerId !== event.pointerId) return
    dragStart.current = null
    const fingerDistance = Math.max(0, event.clientY - start.y)
    const panelOffset = Math.max(0, start.offsetY + fingerDistance)
    const panel = panelRef.current

    if (smoothSwipe) {
      if (dragFrame.current !== null) window.cancelAnimationFrame(dragFrame.current)
      dragFrame.current = null
      pendingDragOffset.current = null

      if (panel) {
        // Commit the finger's final position before starting either transition.
        panel.style.transition = 'none'
        panel.style.transform = `translate3d(0, ${panelOffset}px, 0)`
        panel.getBoundingClientRect()
      }

      const elapsed = Math.max(1, performance.now() - start.startedAt)
      const velocity = (event.clientY - start.y) / elapsed
      const dismiss = !cancelled && shouldDismissSheetSwipe(fingerDistance, panel?.clientHeight ?? 0, velocity)
      if (dismiss) {
        close()
        return
      }

      if (panel) {
        if (prefersReducedMotion()) {
          panel.style.removeProperty('transition')
          panel.style.removeProperty('transform')
        } else {
          panel.style.transition = `transform ${SWIPE_RETURN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
          panel.style.transform = 'translate3d(0, 0, 0)'
          swipeReturnTimer.current = window.setTimeout(() => {
            swipeReturnTimer.current = null
            if (panelRef.current === panel && !exiting.current) {
              panel.style.removeProperty('transition')
              panel.style.removeProperty('transform')
            }
          }, SWIPE_RETURN_MS + 24)
        }
      }
      return
    }

    const dismiss = !cancelled && fingerDistance > Math.max(96, (panel?.clientHeight ?? 0) * 0.2)
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
