import type { User } from '@prisma/client'
import { Authenticator } from '@solid-auth/core'
import { DiscordStrategy } from '@solid-auth/socials'
import { serverEnv } from '~/env/server'
import { sessionStorage } from '~/utils/auth'
import { prisma } from './db/client'

export const authenticator = new Authenticator<User>(sessionStorage)

authenticator.use(
  new DiscordStrategy(
    {
      clientID: serverEnv.DISCORD_CLIENT_ID,
      clientSecret: serverEnv.DISCORD_CLIENT_SECRET,
      callbackURL: serverEnv.SITE_URL + '/api/auth/discord/callback',
      prompt: 'none',
    },
    async ({ profile }) => {
      const user = await prisma.user.upsert({
        where: { id: profile.id },
        create: {
          id: profile.id,
          displayName: profile.__json.username,
          avatar: profile.photos[0].value,
        },
        update: {
          displayName: profile.__json.username,
          avatar: profile.photos[0].value,
        },
      })
      return user
    }
  )
)
