import {
  isPersonalRoutineOwner,
  isPersonalRoutineRecord,
  readBearerToken,
} from './personal-routine-access.ts'

type AuthUser = { email?: string | null } | null
type RoutineQueryResult = { data: unknown; error: { code?: string } | null }

export type PersonalRoutineApiClient = {
  auth: {
    getUser: (token: string) => Promise<{ data: { user: AuthUser }; error: unknown | null }>
  }
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<RoutineQueryResult>
      }
    }
  }
}

type ClientFactory = (token: string) => PersonalRoutineApiClient | null

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  })
}

export function createPersonalRoutineHandler(createClientForToken: ClientFactory) {
  return async function getPersonalRoutine(request: Request) {
    const accessToken = readBearerToken(request.headers.get('authorization'))
    if (!accessToken) return json({ owner: false }, 401)

    let supabase: PersonalRoutineApiClient | null
    try {
      supabase = createClientForToken(accessToken)
    } catch {
      return json({ owner: false }, 503)
    }
    if (!supabase) return json({ owner: false }, 503)

    let email: string
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser(accessToken)
      email = authData.user?.email ?? ''
      if (authError || !email) return json({ owner: false }, 401)
    } catch {
      return json({ owner: false }, 401)
    }
    if (!isPersonalRoutineOwner(email)) return json({ owner: false })

    try {
      // The caller's JWT remains attached, so the database's owner-only RLS policy is a second boundary.
      const { data, error } = await supabase
        .from('personal_routines')
        .select('routine, skipped_courses, skipped_labs')
        .eq('owner_email', email.trim().toLowerCase())
        .maybeSingle()

      if (error) {
        console.error('Could not load the authenticated owner personal routine.', error.code)
        return json({ owner: true, error: 'unavailable' }, 502)
      }
      if (!data) return json({ owner: true, routine: null })
      if (!isPersonalRoutineRecord(data)) {
        console.error('The authenticated owner personal routine has an invalid shape.')
        return json({ owner: true, error: 'invalid_data' }, 502)
      }

      return json({ owner: true, routine: data })
    } catch {
      console.error('Could not load the verified owner personal routine.')
      return json({ owner: true, error: 'unavailable' }, 502)
    }
  }
}
