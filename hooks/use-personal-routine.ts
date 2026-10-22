'use client'

import { useCallback, useEffect, useState } from 'react'

import type { RoutineItem } from '@/lib/routine-data'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

type PersonalRoutine = {
  routine: RoutineItem[]
  skipped_courses: string[]
  skipped_labs: string[]
}

export type PersonalRoutineStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'error'

type PersonalRoutineState = {
  userId: string
  owner: boolean
  status: PersonalRoutineStatus
  routine: PersonalRoutine | null
}

type ApiResponse = {
  owner?: boolean
  routine?: PersonalRoutine | null
  error?: string
}

const EMPTY_ROUTINE: RoutineItem[] = []
const EMPTY_LIST: string[] = []

function isPersonalRoutine(value: unknown): value is PersonalRoutine {
  if (!value || typeof value !== 'object') return false
  const routine = value as Partial<PersonalRoutine>
  return Array.isArray(routine.routine) &&
    Array.isArray(routine.skipped_courses) &&
    routine.skipped_courses.every((item) => typeof item === 'string') &&
    Array.isArray(routine.skipped_labs) &&
    routine.skipped_labs.every((item) => typeof item === 'string')
}

export function usePersonalRoutine(userId: string | null) {
  const [state, setState] = useState<PersonalRoutineState | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const current = state?.userId === userId ? state : null

  useEffect(() => {
    if (!userId || !isSupabaseConfigured || !supabase) {
      setState(null)
      return
    }

    let active = true
    setState((previous) => previous?.userId === userId
      ? { ...previous, status: 'loading' }
      : { userId, owner: false, status: 'loading', routine: null })

    void (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!session?.access_token) {
          if (active) setState({ userId, owner: false, status: 'idle', routine: null })
          return
        }

        const response = await fetch('/api/personal-routine', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        })
        const payload = await response.json() as ApiResponse
        if (!active) return

        if (response.status === 401 || payload.owner !== true) {
          setState({ userId, owner: false, status: 'idle', routine: null })
          return
        }
        if (!response.ok || payload.error) {
          setState((previous) => ({
            userId,
            owner: true,
            status: 'error',
            routine: previous?.userId === userId ? previous.routine : null,
          }))
          return
        }
        if (payload.routine === null || payload.routine === undefined) {
          setState({ userId, owner: true, status: 'missing', routine: null })
          return
        }
        if (!isPersonalRoutine(payload.routine)) {
          setState({ userId, owner: true, status: 'error', routine: null })
          return
        }
        setState({ userId, owner: true, status: 'ready', routine: payload.routine })
      } catch {
        if (!active) return
        setState((previous) => ({
          userId,
          owner: previous?.userId === userId && previous.owner,
          status: 'error',
          routine: previous?.userId === userId ? previous.routine : null,
        }))
      }
    })()

    return () => { active = false }
  }, [userId, retryCount])

  const retry = useCallback(async () => {
    if (supabase) {
      try {
        await supabase.auth.refreshSession()
      } catch {
        // The API call below still gets a chance to verify the current token.
      }
    }
    setRetryCount((count) => count + 1)
  }, [])

  return {
    isOwner: current?.owner ?? false,
    routine: current?.routine?.routine ?? EMPTY_ROUTINE,
    skippedCourses: current?.routine?.skipped_courses ?? EMPTY_LIST,
    skippedLabs: current?.routine?.skipped_labs ?? EMPTY_LIST,
    status: current?.status ?? (userId ? 'loading' : 'idle'),
    retry,
  }
}
