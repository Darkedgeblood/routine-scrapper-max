'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

type SheetPhase = 'opening' | 'open' | 'closing'
type SheetExit = 'profile' | 'slide-down'

/** Keeps a bottom sheet mounted for its exit transition and supports a native-style drag handle. */
export function useSheetMotion(open: boolean, onClose: () => void, exit: SheetExit = 'profile') {
  const [mounted, setMounted] = useState(open)
  const [phase, setPhase] = useState<SheetPhase>(open ? 'open' : 'opening')
  const panelRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ pointerId: number; y: number } | null>(null)

  useEffect(() => {
    if (!open) {
      setPhase('closing')
      const timer = window.setTimeout(() => setMounted(false), exit === 'slide-down' ? 280 : 220)
      return () => window.clearTimeout(timer)
    }

    setMounted(true)
    setPhase('opening')
    const frame = window.requestAnimationFrame(() => setPhase('open'))
    return () => window.cancelAnimationFrame(frame)
  }, [exit, open])

  const close = useCallback(() => {
    setPhase('closing')
    onClose()
  }, [onClose])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
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

  const finishDrag = (event: PointerEvent<HTMLDivElement>, dismiss: boolean) => {
    const start = dragStart.current
    if (!start || start.pointerId !== event.pointerId) return
    dragStart.current = null
    const panel = panelRef.current
    if (dismiss && exit === 'slide-down') {
      if (panel) {
        const distance = Math.max(0, event.clientY - start.y)
        panel.style.transition = 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)'
        panel.style.transform = `translate3d(0, max(100%, ${distance}px), 0)`
      }
      setPhase('closing')
      onClose()
      return
    }

    if (panel) {
      panel.style.removeProperty('transition')
      panel.style.removeProperty('transform')
    }
    if (dismiss) onClose()
  }

  return {
    mounted,
    phase,
    exit,
    close,
    panelRef,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
        const distance = Math.max(0, event.clientY - (dragStart.current?.y ?? event.clientY))
        finishDrag(event, distance > Math.max(96, (panelRef.current?.clientHeight ?? 0) * 0.2))
      },
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finishDrag(event, false),
    },
  }
}
