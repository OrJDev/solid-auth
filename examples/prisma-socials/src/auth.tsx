import {
  type Accessor,
  createContext,
  createSignal,
  type JSX,
  onMount,
  useContext,
} from 'solid-js'
import { sessionStorage } from './utils/auth'
import { type User } from '@prisma/client'

const authContext = createContext<{
  user: Accessor<User | undefined | null>
  getUser: () => Promise<void>
  loading: Accessor<boolean>
}>()

export const useSession = () => {
  const ctx = useContext(authContext)
  if (!ctx) {
    throw new Error('useSession must be used within an AuthProvider')
  }
  return () => {
    const user = ctx.user()
    const loading = ctx.loading()
    return {
      user,
      loading,
    }
  }
}

export const useSessionRefetch = () => {
  const ctx = useContext(authContext)
  if (!ctx) {
    throw new Error('useSession must be used within an AuthProvider')
  }
  return async () => {
    await ctx.getUser()
  }
}

export const AuthProvider = (props: { children: JSX.Element }) => {
  const [user, setUser] = createSignal<User | undefined | null>()
  const [loading, setLoading] = createSignal(true)
  onMount(getUser)

  async function getUser() {
    setLoading(true)
    try {
      const session = await sessionStorage.getSession(document.cookie)
      const myUser = session.get('user')
      setUser(myUser ?? null)
    } catch {
      setUser(null)
    }
    setLoading(false)
  }

  return (
    <authContext.Provider
      value={{ user, getUser, loading }}
      children={props.children}
    />
  )
}
