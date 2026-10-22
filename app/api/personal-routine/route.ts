import { createClient } from '@supabase/supabase-js'

import { createPersonalRoutineHandler, type PersonalRoutineApiClient } from '../../../lib/personal-routine-handler'

export const dynamic = 'force-dynamic'

const getPersonalRoutine = createPersonalRoutineHandler((accessToken) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !publishableKey) return null

  return createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  }) as unknown as PersonalRoutineApiClient
})

export const GET = getPersonalRoutine
