import { type VoidComponent, createSignal } from 'solid-js'
import { Match, Switch } from 'solid-js'
import { refetchRouteData, Title, useRouteData } from 'solid-start'
import { createServerData$ } from 'solid-start/server'
import { useSessionRefetch } from '~/auth'
import { authenticator } from '~/server/auth'
import { authClient } from '~/utils/auth'

export const routeData = () => {
  return createServerData$(async (_, { request }) => {
    return await authenticator.isAuthenticated(request)
  })
}

const Home: VoidComponent = () => {
  const res = useRouteData<typeof routeData>()
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const refetchSession = useSessionRefetch()
  return (
    <>
      <Title>Home</Title>
      <div>
        <Switch
          fallback={
            <div class='font-bold text-2xl text-gray-500'>Loading...</div>
          }
        >
          <Match when={res() !== null}>
            <pre class='font-bold text-2xl text-gray-500'>
              {JSON.stringify(res(), null, 2)}
            </pre>
          </Match>
          <Match when={res() === null}>
            <pre>Not logged in</pre>
          </Match>
        </Switch>
        <Switch
          fallback={
            <>
              <input
                type='email'
                value={email()}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder='Email'
              />
              <input
                type='password'
                value={password()}
                onChange={(e) => setPassword(e.currentTarget.value)}
                placeholder='Password'
              />
              <button
                onClick={async () => {
                  try {
                    await authClient.login('credentials', {
                      input: {
                        password: password(),
                        email: email(),
                      },
                    })
                    refetchSession()
                    await refetchRouteData()
                  } catch (e) {
                    console.log('auth error', e)
                  }
                }}
              >
                Sign In
              </button>
            </>
          }
        >
          <Match when={res()}>
            <button
              onClick={() =>
                authClient.logout({
                  redirectTo: '/',
                })
              }
            >
              Logout
            </button>
          </Match>
        </Switch>
      </div>
    </>
  )
}

export default Home
