import { type User } from '@prisma/client'
import { createSolidAuthHandler } from '@solid-auth/core'
import { authenticator } from '~/server/auth'

const handler = createSolidAuthHandler<User>(authenticator)

export const POST = handler
export const GET = handler
