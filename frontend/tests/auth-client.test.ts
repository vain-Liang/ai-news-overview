import assert from 'node:assert/strict'
import test from 'node:test'

import { fetchCurrentUser, healthcheck, loginUser, registerUser } from '../src/features/auth/api/auth-client.ts'

type FetchCall = {
  input: RequestInfo | URL
  init?: RequestInit
}

const createJsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

test('healthcheck uses the default /api prefix', async () => {
  const calls: FetchCall[] = []

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init })
    return createJsonResponse({ status: 'ok' })
  }

  const response = await healthcheck()

  assert.deepEqual(response, { status: 'ok' })
  assert.equal(calls.length, 1)
  assert.equal(String(calls[0]?.input), '/api/healthz')
})

test('registerUser posts JSON to the register endpoint', async () => {
  const calls: FetchCall[] = []

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init })
    return createJsonResponse({ id: '1', email: 'a@example.com' })
  }

  await registerUser({
    email: 'a@example.com',
    password: 'StrongPass123!',
    username: 'reader',
    nickname: 'Reader',
  })

  assert.equal(String(calls[0]?.input), '/api/auth/register')
  assert.equal(calls[0]?.init?.method, 'POST')
  assert.equal((calls[0]?.init?.headers as Record<string, string>)['Content-Type'], 'application/json')
  assert.match(String(calls[0]?.init?.body), /"email":"a@example.com"/)
})

test('loginUser sends form encoded credentials expected by fastapi-users', async () => {
  const calls: FetchCall[] = []

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init })
    return createJsonResponse({ access_token: 'token', token_type: 'bearer' })
  }

  const response = await loginUser({ email: 'a@example.com', password: 'StrongPass123!' })

  assert.equal(response.access_token, 'token')
  assert.equal(String(calls[0]?.input), '/api/auth/jwt/login')
  assert.equal((calls[0]?.init?.headers as Record<string, string>)['Content-Type'], 'application/x-www-form-urlencoded')
  const body = calls[0]?.init?.body
  assert.ok(body instanceof URLSearchParams)
  assert.equal(body.get('username'), 'a@example.com')
  assert.equal(body.get('password'), 'StrongPass123!')
})

test('fetchCurrentUser attaches the bearer token', async () => {
  const calls: FetchCall[] = []

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init })
    return createJsonResponse({ id: '1', email: 'a@example.com' })
  }

  await fetchCurrentUser('jwt-token')

  assert.equal(String(calls[0]?.input), '/api/users/me')
  assert.equal((calls[0]?.init?.headers as Record<string, string>).Authorization, 'Bearer jwt-token')
})
