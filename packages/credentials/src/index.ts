import { type SessionStorage } from 'solid-start'
import { type AuthenticateOptions, Strategy } from '@solid-auth/core'

export interface CredentialsStrategyVerifyParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any
}

export class CredentialsStrategy<User> extends Strategy<
  User,
  CredentialsStrategyVerifyParams
> {
  name = 'credentials'

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions
  ): Promise<User> {
    const { opts } = await request.clone().json()
    try {
      const user = await this.verify({ input: opts?.input ?? {} })
      return this.success(user, request, sessionStorage, options)
    } catch (error) {
      if (error instanceof Error) {
        return await this.failure(
          error.message,
          request,
          sessionStorage,
          options,
          error
        )
      }

      if (typeof error === 'string') {
        return await this.failure(
          error,
          request,
          sessionStorage,
          options,
          new Error(error)
        )
      }

      return await this.failure(
        'Unknown error',
        request,
        sessionStorage,
        options,
        new Error(JSON.stringify(error, null, 2))
      )
    }
  }
}
