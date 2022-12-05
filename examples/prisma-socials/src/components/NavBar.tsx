import { Match, Switch, type Component } from 'solid-js'
import { useSession } from '~/auth'

const NavBar: Component = () => {
  const session = useSession()
  return (
    <nav class='w-full p-3 bg-gray-300'>
      <Switch fallback={<h3>Not Logged In</h3>}>
        <Match when={session().loading}>
          <h3 class='text-red-500 text-lg'>Loading...</h3>
        </Match>
        <Match when={session().user} keyed>
          {(user) => <h3 class='text-red-500 text-lg'>{user.displayName}</h3>}
        </Match>
      </Switch>
    </nav>
  )
}

export default NavBar
