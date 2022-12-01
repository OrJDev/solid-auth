import { json, type APIEvent } from 'solid-start'
import { type Authenticator } from './authenticator'
import { withApiHandler } from './helpers/withAPIHandler'
import type { IAction, Session, WithProvider } from './types'

export const createSolidAuthHandler = <User>(
  authenticator: Authenticator<User>
) => {
  return async (event: APIEvent) => {
    if (event.request.method === 'POST') {
      const body = await event.request.clone().json()
      const { opts, type } = body
      switch (type) {
        case 'login': {
          return await withApiHandler(async () => {
            const { provider } = body
            if (!provider) {
              throw new Error('No provider specified')
            }
            return await authenticator.authenticate(
              provider,
              event.request,
              opts
            )
          })
        }
        case 'logout': {
          if (!('redirectTo' in opts)) {
            throw new Error('redirectTo is required')
          }
          try {
            return await authenticator.logout(event.request, opts)
          } catch (e) {
            return json({ error: eToString(e) })
          }
        }
      }
    } else if (event.request.method === 'GET') {
      const url = new URL(event.request.url)
      if (!url.pathname.endsWith('/callback')) {
        throw new Error('No callback specified')
      }
      const callbackIdx = url.pathname.lastIndexOf('/callback')
      const provider = url.pathname.slice(1, callbackIdx).split('/').pop()
      if (!provider) {
        return json({ error: 'No provider specified' })
      }
      return await authenticator.authenticate(provider, event.request)
    }
  }
}

export const createSolidAuthClient = (authURL: string) => {
  const wrapper = withHandler(authURL)
  type IOpts = Parameters<Authenticator['authenticate']>[2]
  return {
    logout: async (opts: Parameters<Authenticator['logout']>[1]) =>
      await wrapper({
        type: 'logout',
        opts,
      }),
    login: async <K extends string>(
      provider: K,
      opts: K extends 'credentials'
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { input: any }
        : Omit<IOpts, 'successRedirect' | 'failureRedirect'> & {
            successRedirect: string
            failureRedirect: string
          }
    ) =>
      await wrapper({
        type: 'login',
        provider,
        opts,
      }),
  }
}

const withHandler =
  (authURL: string) =>
  async <T extends IAction>(body: WithProvider<T>) => {
    const res = await fetch(authURL, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const json = await res.json()
    if ('redirect' in json) {
      return (window.location.href = json.redirect)
    }
    if ('error' in json) {
      throw new Error(json.error)
    }
    if ('message' in json) {
      throw new Error(json.message)
    }
    return json
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const eToString = (e: any): string => {
  if (typeof e === 'string') return e
  else if (typeof e === 'object') {
    if ('code' in e && 'message' in e) {
      ;`${e.code}: ${e.message}`
    } else if ('message' in e) {
      return eToString(e.message)
    } else if ('stack' in e) {
      return eToString(e.stack)
    }
  } else if (typeof e === 'number') {
    return e.toString()
  }
  return 'Something went wrong'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IsSessionFunction = (object: any) => object is Session

export const isSession: IsSessionFunction = (object): object is Session => {
  return (
    object != null &&
    typeof object.id === 'string' &&
    typeof object.data !== 'undefined' &&
    typeof object.has === 'function' &&
    typeof object.get === 'function' &&
    typeof object.set === 'function' &&
    typeof object.flash === 'function' &&
    typeof object.unset === 'function'
  )
}
