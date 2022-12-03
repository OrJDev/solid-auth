import type { User } from '@prisma/client'
import { Authenticator } from '@solid-auth/core'
import { sessionStorage } from '~/utils/auth'
import { CredentialsStrategy } from '@solid-auth/credentials'
import { prisma } from './db/client'

export const authenticator = new Authenticator<Omit<User, 'password'>>(
  sessionStorage
)

authenticator.use(
  new CredentialsStrategy(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
    })
    // errors will be thrown on the client
    if (!user) {
      throw new Error('User not found')
    }
    if (user.password !== input.password) {
      throw new Error('Invalid password')
    }
    // just to check the return type, it's not needed
    if (!user) return null
    if (!user) return undefined
    return {
      email: user.email,
      id: user.id,
    }
  })
)
