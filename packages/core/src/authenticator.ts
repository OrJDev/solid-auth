import { json, redirect, type SessionStorage } from 'solid-start'
import type { AuthenticateOptions, Strategy } from './strategy'
import { type Session } from './types'
import { isSession } from './utils'

export interface AuthenticateCallback<User> {
  (user: User): Promise<Response>
}

export const DEFAULT_SESS_KEY = 'user'

/**
 * Extra options for the authenticator.
 */
export interface AuthenticatorOptions {
  sessionKey?: AuthenticateOptions['sessionKey']
  sessionErrorKey?: AuthenticateOptions['sessionErrorKey']
  sessionStrategyKey?: AuthenticateOptions['sessionStrategyKey']
  throwOnError?: AuthenticateOptions['throwOnError']
}

export class Authenticator<User = unknown> {
  /**
   * A map of the configured strategies, the key is the name of the strategy
   * @private
   */
  private strategies = new Map<string, Strategy<User, never>>()

  public readonly sessionKey: NonNullable<AuthenticatorOptions['sessionKey']>
  public readonly sessionErrorKey: NonNullable<
    AuthenticatorOptions['sessionErrorKey']
  >
  public readonly sessionStrategyKey: NonNullable<
    AuthenticateOptions['sessionStrategyKey']
  >
  private readonly throwOnError: AuthenticatorOptions['throwOnError']

  constructor(
    private sessionStorage: SessionStorage,
    options: AuthenticatorOptions = {}
  ) {
    this.sessionKey = options.sessionKey || DEFAULT_SESS_KEY
    this.sessionErrorKey = options.sessionErrorKey || 'auth:error'
    this.sessionStrategyKey = options.sessionStrategyKey || 'strategy'
    this.throwOnError = options.throwOnError ?? false
  }
  use(strategy: Strategy<User, never>, name?: string): this {
    this.strategies.set(name ?? strategy.name, strategy)
    return this
  }

  unuse(name: string): this {
    this.strategies.delete(name)
    return this
  }

  authenticate(
    strategy: string,
    request: Request,
    options: Pick<
      AuthenticateOptions,
      'successRedirect' | 'failureRedirect' | 'throwOnError' | 'context'
    > = {}
  ): Promise<User> {
    const strategyObj = this.strategies.get(strategy)
    if (!strategyObj) throw new Error(`Strategy ${strategy} not found.`)
    return strategyObj.authenticate(
      new Request(request.url, request),
      this.sessionStorage,
      {
        throwOnError: this.throwOnError,
        ...options,
        name: strategy,
        sessionKey: this.sessionKey,
        sessionErrorKey: this.sessionErrorKey,
        sessionStrategyKey: this.sessionStrategyKey,
      }
    )
  }

  async isAuthenticated(
    request: Request | Session,
    options?: { successRedirect?: never; failureRedirect?: never }
  ): Promise<User | null>
  async isAuthenticated(
    request: Request | Session,
    options: { successRedirect: string; failureRedirect?: never }
  ): Promise<null>
  async isAuthenticated(
    request: Request | Session,
    options: { successRedirect?: never; failureRedirect: string }
  ): Promise<User>
  async isAuthenticated(
    request: Request | Session,
    options: { successRedirect: string; failureRedirect: string }
  ): Promise<null>
  async isAuthenticated(
    request: Request | Session,
    options:
      | { successRedirect?: never; failureRedirect?: never }
      | { successRedirect: string; failureRedirect?: never }
      | { successRedirect?: never; failureRedirect: string }
      | { successRedirect: string; failureRedirect: string } = {}
  ): Promise<User | null> {
    const session = isSession(request)
      ? request
      : await this.sessionStorage.getSession(request.headers.get('Cookie'))

    const user: User | null = session.get(this.sessionKey) ?? null

    if (user) {
      if (options.successRedirect) throw redirect(options.successRedirect)
      else return user
    }

    if (options.failureRedirect) throw redirect(options.failureRedirect)
    else return null
  }

  /**
   * Destroy the user session throw a redirect to another URL.
   * @example
   * async function action({ request }: ActionArgs) {
   *   await authenticator.logout(request, { redirectTo: "/login" });
   * }
   */
  async logout(request: Request, options?: { redirectTo?: string }) {
    const session = await this.sessionStorage.getSession(
      request.headers.get('Cookie')
    )
    if (options?.redirectTo) {
      return json(
        { redirect: options.redirectTo },
        {
          headers: {
            'Set-Cookie': await this.sessionStorage.destroySession(session),
            Location: options.redirectTo,
          },
        }
      )
    }
    return json(
      { success: true },
      {
        headers: {
          'Set-Cookie': await this.sessionStorage.destroySession(session),
        },
      }
    )
  }
}
