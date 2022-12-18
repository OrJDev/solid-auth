import {
  Strategy,
  type AuthenticateOptions,
  type StrategyVerifyCallback,
} from '@solid-auth/core'
import type { SessionStorage } from 'solid-start'
import { json } from 'solid-start'

export interface OAuth2Profile {
  provider: string
  id?: string | number
  displayName?: string
  name?: {
    familyName?: string
    givenName?: string
    middleName?: string
  }
  emails?: Array<{
    value: string
    type?: string
  }>
  photos?: Array<{ value: string }>
}

type ResponseType =
  | 'id_token'
  | 'token'
  | 'id_token token'
  | 'code'
  | 'code id_token'
  | 'code id_token token'

export interface OAuth2StrategyOptions {
  authorizationURL: string
  tokenURL: string
  clientID: string
  clientSecret: string
  callbackURL: string
  responseType?: ResponseType
}

export interface OAuth2StrategyVerifyParams<
  Profile extends OAuth2Profile,
  ExtraParams extends Record<string, unknown> = Record<string, never>
> {
  accessToken: string
  refreshToken: string
  extraParams: ExtraParams
  profile: Profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: Record<any, any>
}

/**
 * The OAuth 2.0 authentication strategy authenticates requests using the OAuth
 * 2.0 framework.
 *
 * OAuth 2.0 provides a facility for delegated authentication, whereby users can
 * authenticate using a third-party service such as Facebook.  Delegating in
 * this manner involves a sequence of events, including redirecting the user to
 * the third-party service for authorization.  Once authorization has been
 * granted, the user is redirected back to the application and an authorization
 * code can be used to obtain credentials.
 *
 * Applications must supply a `verify` callback, for which the function
 * signature is:
 *
 *     function(accessToken, refreshToken, profile) { ... }
 *
 * The verify callback is responsible for finding or creating the user, and
 * returning the resulting user object.
 *
 * An AuthorizationError should be raised to indicate an authentication failure.
 *
 * Options:
 * - `authorizationURL`  URL used to obtain an authorization grant
 * - `tokenURL`          URL used to obtain an access token
 * - `clientID`          identifies client to service provider
 * - `clientSecret`      secret used to establish ownership of the client identifier
 * - `callbackURL`       URL to which the service provider will redirect the user after obtaining authorization
 *
 * @example
 * authenticator.use(new OAuth2Strategy(
 *   {
 *     authorizationURL: 'https://www.example.com/oauth2/authorize',
 *     tokenURL: 'https://www.example.com/oauth2/token',
 *     clientID: '123-456-789',
 *     clientSecret: 'shhh-its-a-secret'
 *     callbackURL: 'https://www.example.net/auth/example/callback'
 *   },
 *   async ({ accessToken, refreshToken, profile }) => {
 *     return await User.findOrCreate(...);
 *   }
 * ));
 */
export class OAuth2Strategy<
  User,
  Profile extends OAuth2Profile,
  ExtraParams extends Record<string, unknown> = Record<string, never>
> extends Strategy<User, OAuth2StrategyVerifyParams<Profile, ExtraParams>> {
  name = 'oauth2'

  protected authorizationURL: string
  protected tokenURL: string
  protected clientID: string
  protected clientSecret: string
  protected callbackURL: string
  protected responseType: ResponseType

  private sessionStateKey = 'oauth2:state'

  constructor(
    options: OAuth2StrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<Profile, ExtraParams>
    >
  ) {
    super(verify)
    this.authorizationURL = options.authorizationURL
    this.tokenURL = options.tokenURL
    this.clientID = options.clientID
    this.clientSecret = options.clientSecret
    this.callbackURL = options.callbackURL
    this.responseType = options.responseType ?? 'code'
  }

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions
  ) {
    const url = new URL(request.url)
    const session = await sessionStorage.getSession(
      request.headers.get('Cookie')
    )

    let user: User | null = session.get(options.sessionKey) ?? null
    // User is already authenticated
    if (user) {
      console.log(
        '🚀 ~ file: index.ts:141 ~ session',
        'session after user is authed',
        session
      )
      return this.success(user, request, sessionStorage, options)
    }

    // Redirect the user to the callback URL
    const callbackURL = this.getCallbackURL(url)
    if (url.pathname !== callbackURL.pathname) {
      const state = this.generateState()
      session.set(this.sessionStateKey, state)
      session.set('opts', { ...options, sessionStateKey: this.sessionStateKey })
      console.log(
        '🚀 ~ file: index.ts:155 ~ session',
        'session before redirect to oauth provider',
        session
      )
      const reURI = this.getAuthorizationURL(request, state).toString()
      return json(
        { redirect: reURI },
        {
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
            Location: reURI,
          },
        }
      )
    }

    // Validations of the callback URL params

    const stateUrl = url.searchParams.get('state')
    if (!stateUrl)
      throw json({ message: 'Missing state on URL.' }, { status: 400 })

    const stateSession = session.get(this.sessionStateKey)
    if (!stateSession) {
      throw json({ message: 'Missing state on session.' }, { status: 400 })
    }
    if (stateSession === stateUrl) {
      session.unset(this.sessionStateKey)
    } else throw json({ message: "State doesn't match." }, { status: 400 })

    const code = url.searchParams.get('code')
    if (!code) throw json({ message: 'Missing code.' }, { status: 400 })

    console.log(
      '🚀 ~ file: index.ts:189 ~ session',
      'session after checks',
      session
    )
    // Get the access token
    const params = new URLSearchParams(this.tokenParams())
    params.set('grant_type', 'authorization_code')
    params.set('redirect_uri', callbackURL.toString())

    const { accessToken, refreshToken, extraParams } =
      await this.fetchAccessToken(code, params)
    // Get the profile
    const profile = await this.userProfile(accessToken, extraParams)
    // Verify the user and return it, or redirect
    const newOpts = session.get('opts') ?? {}
    try {
      user = await this.verify({
        accessToken,
        refreshToken,
        extraParams,
        profile,
        context: newOpts.context,
      })
    } catch (error) {
      const message = (error as Error).message
      return await this.failure(message, request, sessionStorage, newOpts)
    }
    return await this.success(user, request, sessionStorage, newOpts)
  }

  /**
   * Retrieve user profile from service provider.
   *
   * OAuth 2.0-based authentication strategies can override this function in
   * order to load the user's profile from the service provider.  This assists
   * applications (and users of those applications) in the initial registration
   * process by automatically submitting required information.
   */
  protected async userProfile(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accessToken: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: ExtraParams
  ): Promise<Profile> {
    return { provider: 'oauth2' } as Profile
  }

  /**
   * Return extra parameters to be included in the authorization request.
   *
   * Some OAuth 2.0 providers allow additional, non-standard parameters to be
   * included when requesting authorization.  Since these parameters are not
   * standardized by the OAuth 2.0 specification, OAuth 2.0-based authentication
   * strategies can override this function in order to populate these
   * parameters as required by the provider.
   */
  protected authorizationParams(params: URLSearchParams): URLSearchParams {
    return new URLSearchParams(params)
  }

  /**
   * Return extra parameters to be included in the token request.
   *
   * Some OAuth 2.0 providers allow additional, non-standard parameters to be
   * included when requesting an access token.  Since these parameters are not
   * standardized by the OAuth 2.0 specification, OAuth 2.0-based authentication
   * strategies can override this function in order to populate these
   * parameters as required by the provider.
   */
  protected tokenParams(): URLSearchParams {
    return new URLSearchParams()
  }

  protected async getAccessToken(response: Response): Promise<{
    accessToken: string
    refreshToken: string
    extraParams: ExtraParams
  }> {
    const { access_token, refresh_token, ...extraParams } =
      await response.json()
    return {
      accessToken: access_token as string,
      refreshToken: refresh_token as string,
      extraParams,
    } as const
  }

  private getCallbackURL(url: URL) {
    if (
      this.callbackURL.startsWith('http:') ||
      this.callbackURL.startsWith('https:')
    ) {
      return new URL(this.callbackURL)
    }
    if (this.callbackURL.startsWith('/')) {
      return new URL(this.callbackURL, url)
    }
    return new URL(`${url.protocol}//${this.callbackURL}`)
  }

  private getAuthorizationURL(request: Request, state: string) {
    const params = new URLSearchParams(
      this.authorizationParams(new URL(request.url).searchParams)
    )
    params.set('response_type', this.responseType)
    params.set('client_id', this.clientID)
    params.set(
      'redirect_uri',
      this.getCallbackURL(new URL(request.url)).toString()
    )
    params.set('state', state)

    const url = new URL(this.authorizationURL)
    url.search = params.toString()

    return url
  }

  private generateState() {
    return crypto.randomUUID()
  }

  /**
   * Format the data to be sent in the request body to the token endpoint.
   */
  private async fetchAccessToken(
    code: string,
    params: URLSearchParams
  ): Promise<{
    accessToken: string
    refreshToken: string
    extraParams: ExtraParams
  }> {
    params.set('client_id', this.clientID)
    params.set('client_secret', this.clientSecret)

    if (params.get('grant_type') === 'refresh_token') {
      params.set('refresh_token', code)
    } else {
      params.set('code', code)
    }

    const response = await fetch(this.tokenURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })

    if (!response.ok) {
      try {
        const body = await response.text()
        throw new Response(body, { status: 401 })
      } catch (error) {
        throw new Response((error as Error).message, { status: 401 })
      }
    }

    return await this.getAccessToken(response.clone() as unknown as Response)
  }
}
