import { createSolidAuthClient } from '@solid-auth/core'
import { createCookieSessionStorage } from 'solid-start'
import { clientEnv } from '~/env/client'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '_session',
    sameSite: 'lax',
    path: '/',
    secrets: [clientEnv.VITE_SESSION_SECRET],
    secure: import.meta.env.PROD,
  },
})

export const authClient = createSolidAuthClient(`${getBaseUrl()}/api/auth`)
