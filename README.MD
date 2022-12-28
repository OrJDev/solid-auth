# Solid Auth

This is a ported and improved version of [Remix Auth](https://github.com/sergiodxa/remix-auth), it is using [Solid Sessions](https://start.solidjs.com/advanced/session) to manage the user sessions / cookies - based on [Solid Start](https://start.solidjs.com/)

> It is highly recommended to start using [next auth for solid](https://github.com/OrJDev/auth-solid) instead, there is a still an oficial [pr](https://github.com/nextauthjs/next-auth/pull/6158) pending but is more secured and doesn't use solid-start cookieSessionStorageAPI.

## Packages

- [@solid-auth/core](https://github.com/OrJDev/solid-auth/tree/main/packages/core) - Core package where the logic, types and strategies are defined
- [@solid-auth/oauth2](https://github.com/OrJDev/solid-auth/tree/main/packages/oauth2) - OAuth2 strategy based on the `@solid-auth/core` strategy
- [@solid-auth/socials](https://github.com/OrJDev/solid-auth/tree/main/packages/socials) - OAuth2 socials providers (like discord, github, google, etc) based on the `@solid-auth/oauth2` strategy
- [@solid-auth/auth0](https://github.com/OrJDev/solid-auth/tree/main/packages/auth0) - Auth0 strategy based on the `@solid-auth/core` and `@solid-auth/oauth2` strategy
- [@solid-auth/credentials](https://github.com/OrJDev/solid-auth/tree/main/packages/credentials) - Use your own conditions, just return the user to the strategy and we will handle the rest for you.
- [@solid-auth/client](https://www.npmjs.com/package/@solid-auth/client) - Client side package that will allow you to get the current session from the client side.

## Getting Started

It is highly recommended to use [Create JD App](https://github.com/OrJDev/create-jd-app) to create your app, it will create a new app with all the necessary packages and configurations, so you won't need to worry about anything.

### Installation

```bash
npm i @solid-auth/core
# if you want to use social providers
npm i @solid-auth/socials
```

### Creating The Server Authenticator

As mentioned previously, `@soid-auth/core` is based on [Solid Sessions](https://start.solidjs.com/advanced/session), so first you need to create a sessionStorage:

```ts file=src/utils/auth.ts
// src/utils/auth.ts
import { createCookieSessionStorage } from 'solid-start'
import { createSolidAuthClient } from '@solid-auth/core'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '_session',
    secrets: ['your-secret'],
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
  },
})

// Create the Solid Auth Client So You Can Actually Manage The User From The Client Side
export const authClient = createSolidAuthClient(`${getBaseUrl()}/api/auth`)
```

Now that you have a session you can create the actual authenticator:

```ts file=src/server/auth.ts
// src/server/auth.ts
import { type User } from '@prisma/client' // the type of your user
import { DiscordStrategy } from '@solid-auth/socials' // or any other provider
import { serverEnv } from '~/env/server' // type safed process.env, doesn't really matter
import { sessionStorage } from '~/utils/auth' // the sessionStorage we created before
import { prisma } from './db/client' // or any other orm you wish to use
import { Authenticator } from '@solid-auth/core'

export const authenticator = new Authenticator<User>(sessionStorage).use(
  new DiscordStrategy(
    {
      clientID: serverEnv.DISCORD_CLIENT_ID,
      clientSecret: serverEnv.DISCORD_CLIENT_SECRET,
      // SITE_URL should be set to: http://localhost:3000 locally and https://yourdomain.com in production
      callbackURL: serverEnv.SITE_URL + '/api/auth/discord/callback',
    },
    async ({ profile }) => {
      let user = await prisma.user.findUnique({
        where: {
          id: profile.id,
        },
      })
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: profile.id,
            displayName: profile.__json.username,
            avatar: profile.photos[0].value,
          },
        })
      }
      return user
    }
  )
)
```

### Handling Auth Requests

But just because we created the authenticator doesn't mean it will work, we need to create the routes to actually handle the authentication:

```ts file=src/routes/api/auth/[...solidauth].ts
// src/routes/api/auth/[...solidauth].ts
import { authenticator } from '~/server/auth' // the authenticator we created before
import { type User } from '@prisma/client' // the type of your user
import { createSolidAuthHandler } from '@solid-auth/core'

const handler = createSolidAuthHandler<User>(authenticator)

export const POST = handler // handle the login, logout etc
export const GET = handler // handle the callback
```

### Making Auth Requests

Now that we have the routes to handle the authentication, we need to make the requests to them, we can do that using the `authClient` we created before:

```ts
import { authClient } from '~/utils/auth' // the authClient we created before
// Sign In
authClient.login('discord' /* or any other provider*/, {
  successRedirect: '/', // where to redirect the user after the login
  failureRedirect: '/account', // where to redirect the user if the login failed
})

// Sign Out
authClient.logout({ redirectTo: '/account' })
```

### Getting The Logged In User

```tsx file=src/routes/example.tsx
// src/routes/example.tsx
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { authenticator } from '~/server/auth' // the authenticator we created before

export const routeData = () => {
  return createServerData$(async (_, { request }) => {
    return await authenticator.isAuthenticated(request);
  });
};

export default function Example() {
  const user = useRouteData<typeof routeData>(); // resource with type User | null | undefined
  return (
    {...}
  );
}
```

### Protected Routes

#### Creating Protected Layout

```tsx file=src/layouts/Protected.tsx
// src/layouts/Protected.tsx
import { Match, Switch, type Component } from 'solid-js'
import { useRouteData } from 'solid-start'
import { createServerData$, redirect } from 'solid-start/server'
import { authenticator } from '~/server/auth' // the authenticator we created before
import { type User } from '@prisma/client' // the type of your user

export const withProtected = (Component: ProtectedRouter) => {
  const routeData = () => {
    return createServerData$(async (_, { request }) => {
      const user = await authenticator.isAuthenticated(request) // check if user session exists
      if (!user) {
        // if not login redirect to login page
        throw redirect('/login') // we use throw and not return because we dont't want to mess the return type
      }
      return user
    })
  }
  return {
    routeData,
    Page: () => {
      const current = useRouteData<typeof routeData>()
      return (
        //  not loading, and current is not instance of Response, the user is logged in - we should render the page
        <Switch fallback={<Component {...(current() as User)} />}>
          {/* if current() is instance of Response, meaning that the user is being redirected to the login page */}
          <Match when={current.loading || current() instanceof Response}>
            <p>Loading</p>
          </Match>
        </Switch>
      )
    },
  }
}

export type ProtectedRouter = Component<User>
```

#### Using The Protected Layout

```tsx file=src/routes/protected.tsx
// src/routes/protected.tsx
import { withProtected } from '../layouts/Protected' // the protected layout we created before
// we export the routeData to get the useRouteData to work
export const { routeData, Page } = withProtected((user) => {
  // type safed user, no need to use ?. anymore
  return <h1>Hey {user.displayName}</h1>
})

export default Page // The page should be default exported, we export `Page` above because we want to export the routeData and its just cleaner
```

## Credits / Inspired By

Thank you [Marco](https://github.com/schweden1997) for converting this app into a monorepo and maintaining it. 

- [Remix Auth](https://github.com/sergiodxa/remix-auth)
- [Remix Auth Socials](https://github.com/TheRealFlyingCoder/remix-auth-socials)
- [Remix Auth OAuth2](https://github.com/sergiodxa/remix-auth-oauth2)
- [Remix Auth Auth0](https://github.com/danestves/remix-auth-auth0)
- [Modular Forms Website](https://github.com/fabian-hiller/modular-forms/tree/main/packages/website)
