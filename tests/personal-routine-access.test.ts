import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isPersonalRoutineOwner,
  isPersonalRoutineRecord,
  readBearerToken,
} from '../lib/personal-routine-access.ts'
import {
  createPersonalRoutineHandler,
  type PersonalRoutineApiClient,
} from '../lib/personal-routine-handler.ts'

test('private routine ownership uses a normalized exact email match', () => {
  assert.equal(isPersonalRoutineOwner(' 252-15-596@DIU.EDU.BD '), true)
  assert.equal(isPersonalRoutineOwner('252-15-596+other@diu.edu.bd'), false)
  assert.equal(isPersonalRoutineOwner('other@diu.edu.bd'), false)
  assert.equal(isPersonalRoutineOwner(null), false)
})

test('bearer-token parser accepts only a single non-empty token', () => {
  assert.equal(readBearerToken('Bearer abc.def'), 'abc.def')
  assert.equal(readBearerToken('bearer abc'), 'abc')
  assert.equal(readBearerToken(null), null)
  assert.equal(readBearerToken('Basic abc'), null)
  assert.equal(readBearerToken('Bearer '), null)
  assert.equal(readBearerToken('Bearer one two'), null)
})

test('personal routine record validator rejects malformed database payloads', () => {
  const row = {
    routine: [{
      id: 'retake-1', day: 'Monday', startTime: '08:30 AM', endTime: '10:00 AM',
      startMinutes: 510, endMinutes: 600, courseCode: 'CSE215', courseTitle: 'Electronics',
      room: 'KT-201', teacher: 'ABC', section: '69_P', isRetake: true, subSection: null,
    }],
    skipped_courses: ['CSE221'],
    skipped_labs: ['69_P1'],
  }
  assert.equal(isPersonalRoutineRecord(row), true)
  assert.equal(isPersonalRoutineRecord({ ...row, skipped_labs: [42] }), false)
  assert.equal(isPersonalRoutineRecord({ ...row, routine: [{ id: 'incomplete' }] }), false)
  assert.equal(isPersonalRoutineRecord(null), false)
})

function makeClient({ email, userError = null, routineData = null, routineError = null }: {
  email: string | null
  userError?: unknown
  routineData?: unknown
  routineError?: { code?: string } | null
}): { client: PersonalRoutineApiClient; calls: string[] } {
  const calls: string[] = []
  const client: PersonalRoutineApiClient = {
    auth: { getUser: async (token) => {
      calls.push(`token:${token}`)
      return { data: { user: email ? { email } : null }, error: userError }
    } },
    from: (table) => {
      calls.push(`table:${table}`)
      return {
        select: (columns) => {
          calls.push(`select:${columns}`)
          return {
            eq: (column, value) => {
              calls.push(`eq:${column}:${value}`)
              return {
                maybeSingle: async () => ({ data: routineData, error: routineError ?? null }),
              }
            },
          }
        },
      }
    },
  }
  return { client, calls }
}

test('personal routine endpoint verifies the bearer token and queries as the owner', async () => {
  const row = { routine: [], skipped_courses: ['CSE221'], skipped_labs: ['69_P1'] }
  const { client, calls } = makeClient({ email: '252-15-596@diu.edu.bd', routineData: row })
  const handler = createPersonalRoutineHandler((token) => {
    assert.equal(token, 'signed-token')
    return client
  })

  const response = await handler(new Request('https://app.test/api/personal-routine', {
    headers: { Authorization: 'Bearer signed-token' },
  }))

  assert.equal(response.status, 200)
  assert.match(response.headers.get('cache-control') ?? '', /no-store/)
  assert.deepEqual(await response.json(), { owner: true, routine: row })
  assert.deepEqual(calls, [
    'token:signed-token',
    'table:personal_routines',
    'select:routine, skipped_courses, skipped_labs',
    'eq:owner_email:252-15-596@diu.edu.bd',
  ])
})

test('personal routine endpoint denies non-owners before touching the table', async () => {
  const { client, calls } = makeClient({ email: 'classmate@diu.edu.bd' })
  const handler = createPersonalRoutineHandler(() => client)
  const response = await handler(new Request('https://app.test/api/personal-routine', {
    headers: { Authorization: 'Bearer signed-token' },
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { owner: false })
  assert.deepEqual(calls, ['token:signed-token'])
})

test('personal routine endpoint rejects missing or invalid bearer sessions', async () => {
  const handler = createPersonalRoutineHandler(() => {
    throw new Error('client should not be created for a missing token')
  })
  const missing = await handler(new Request('https://app.test/api/personal-routine'))
  assert.equal(missing.status, 401)

  const { client } = makeClient({ email: '252-15-596@diu.edu.bd', userError: new Error('invalid token') })
  const invalid = await createPersonalRoutineHandler(() => client)(new Request('https://app.test/api/personal-routine', {
    headers: { Authorization: 'Bearer invalid-token' },
  }))
  assert.equal(invalid.status, 401)
})

test('personal routine endpoint preserves the verified owner state when the database request throws', async () => {
  const { client } = makeClient({ email: '252-15-596@diu.edu.bd' })
  const throwingClient: PersonalRoutineApiClient = {
    ...client,
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => { throw new Error('database unavailable') } }),
      }),
    }),
  }
  const response = await createPersonalRoutineHandler(() => throwingClient)(new Request('https://app.test/api/personal-routine', {
    headers: { Authorization: 'Bearer signed-token' },
  }))

  assert.equal(response.status, 502)
  assert.deepEqual(await response.json(), { owner: true, error: 'unavailable' })
})
