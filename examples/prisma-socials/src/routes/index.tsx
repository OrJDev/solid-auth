import { Match, Switch, type VoidComponent } from 'solid-js'
import { Title, useRouteData } from 'solid-start'
import { createServerData$ } from 'solid-start/server'
import { authenticator } from '~/server/auth'
import { authClient, sessionStorage } from '~/utils/auth'

export const routeData = () => {
  return createServerData$(async (_, { request }) => {
    const session = await sessionStorage.getSession(
      request.headers.get('Cookie')
    )
    console.log(
      '🚀 ~ file: index.tsx:12 ~ returncreateServerData$ ~ session',
      session
    )
    return await authenticator.isAuthenticated(request)
  })
}

const Home: VoidComponent = () => {
  const res = useRouteData<typeof routeData>()

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
            <button
              onClick={() =>
                authClient.login('discord', {
                  successRedirect: '/',
                  failureRedirect: '/',
                })
              }
            >
              Login with discord
            </button>
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
