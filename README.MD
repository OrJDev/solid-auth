> Moved to https://www.npmjs.com/package/@solid-mediakit/auth?activeTab=readme

> If you are using SolidStart Astro, take a look at the [alpha](https://github.com/orjdev/solid-auth/tree/alpha) branch

# Getting started

Recommended to use [create-jd-app](https://github.com/OrJDev/create-jd-app)

```bash
npm install @solid-auth/base@latest @auth/core@latest
```

## Setting It Up

[Generate auth secret](https://generate-secret.vercel.app/32), then set it as an environment variable:

```
AUTH_SECRET=your_auth_secret
```

### On Production

Don't forget to trust the host.

```
AUTH_TRUST_HOST=true
```

## Creating the api handler

in this example we are using github so make sure to set the following environment variables:

```
GITHUB_ID=your_github_oauth_id
GITHUB_SECRET=your_github_oauth_secret
```

```ts
// routes/api/auth/[...solidauth].ts
import { SolidAuth, type SolidAuthConfig } from "@solid-auth/base";
import GitHub from "@auth/core/providers/github";

export const authOpts: SolidAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  debug: false,
};

export const { GET, POST } = SolidAuth(authOpts);
```

## Sign In

The `signIn` is a function that can be used from the client side, it can take two paramaters, the first is `provider`, this is an optional paramater and not passing it will redirect the user to the login page defined in the config, the second is `options` and this can be used to tell SolidAuth where should we redirect (if needed ofc).

```ts
import { signIn } from "@solid-auth/base";
signIn(); // login page
signIn("github"); // login with github and redirect to the exact same page we are at right now
signIn("github", { redirectTo: "/ok" }); // login with github and redirect to /ok
```

## Sign Out

The `signOut` is a function that can be used from the client side, it takes one parameter `options`, you can choose where should SolidAuth redirect after, or if it should redirect.

```ts
import { signOut } from "@solid-auth/base";
signOut(); // redirect to this same page
signOut({ redirectTo: "/ok" }); // redirect to /ok
signOut({ redirect: false }); // don't redirect at all
```

## Getting the current session

### Client Side

Wrap your `Root` with `SessionProvider`

```tsx
// @refresh reload
import { Suspense } from "solid-js";
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start";
import { SessionProvider } from "@solid-auth/base/client";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>Create JD App</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <SessionProvider>
          <Suspense>
            <ErrorBoundary>
              <Routes>
                <FileRoutes />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </SessionProvider>
        <Scripts />
      </Body>
    </Html>
  );
}
```

And then you could use the `createSession` hook:

```ts
import { createSession } from "@solid-auth/base/client";
const session = createSession();

const user = () => session()?.user;
```

This will return a resource, in Solid a resource can be used to trigger suspense so this could be used like:

```tsx
import { Show, type VoidComponent } from "solid-js";
import { A } from "solid-start";
import { createSession, signIn, signOut } from "~/auth/client";

const AuthShowcase: VoidComponent = () => {
  const session = createSession();
  return (
    <div class="flex flex-col items-center justify-center gap-4">
      <Show
        when={session()}
        fallback={
          <button
            onClick={() => signIn("discord", { redirectTo: "/" })}
            class="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
          >
            Sign in
          </button>
        }
      >
        <span class="text-xl text-white">Welcome {session()?.user?.name}</span>
        <button
          onClick={() => signOut({ redirectTo: "/" })}
          class="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        >
          Sign out
        </button>
      </Show>
    </div>
  );
};
```

### Server Side

```ts
import { getSession } from "@solid-auth/base";
import { createServerData$ } from "solid-start/server";
import { authOpts } from "~/routes/api/auth/[...solidauth]";

export const useSession = () => {
  return createServerData$(
    async (_, { request }) => {
      return await getSession(request, authOpts);
    },
    { key: () => ["auth_user"] }
  );
};

// useSession returns a resource:
const session = useSession();
const loading = session.loading;
const user = () => session()?.user;
```

### Providing a custom Session Type
You might want to provide your own User type. In this case you can overwrite the default interface.

```ts
// session-type.d.ts
import { DefaultSession } from "@auth/core/types";

declare module "@auth/core/types" {
  export interface Session extends DefaultSession {
    user?: User
  }
}
```

## Using Credentials strategy

```ts
// routes/api/auth/[...solidauth].ts
import { SolidAuth, type SolidAuthConfig } from '@solid-auth/base'
import Credentials from '@auth/core/providers/credentials'
import { z } from 'zod'
import { DefaultSession } from '@auth/core/types'
import { getUser, compareHash } from 'somewhere'

// Your User type (note: password should not be sent back)
type User = {
  id: string
  name: string
}

// Session to override default value
type CustomSession = DefaultSession & {
  user: User
}

export const authOpts: SolidAuthConfig = {
  providers: [
    Credentials({
      async authorize(credentials): Promise<User | null> {
        const { name, password } = credentials

        // Add validation if needed - here using Zod
        const schema = z.object({ name: z.string().min(1), password: z.string().min(1) })
        if (!schema.safeParse({ name, password }).success) return null

        // Fetch User from Database and check for password match - here using a hash-compare 
        const user = await getUser({ name: credentials.name as string })

        if (!user || !compareHash(user.password, credentials.password as string)) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
        }
      },
    }),
  ],
  // Providing this option will prevent rerouting to @auth's built-in Form page
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      return { ...token, ...user }
    },
    session({ token, session }) {
      return { ...session, user: { ...token } } as CustomSession
    },
  },
}

export const { GET, POST } = SolidAuth(authOpts)
```

```tsx
// routes/login.tsx
import { createSignal, JSX } from 'solid-js'
import { signIn } from '@solid-auth/base/client'

export default function LoginScreen() {
  const [name, setName] = createSignal('')
  const [password, setPassword] = createSignal('')

  const login: JSX.IntrinsicElements['form']['onSubmit'] = async (e) => {
    e.preventDefault()

    const result = await signIn('credentials', { name: name(), password: password(), redirectTo: '/' })
    if (result?.error) console.error('Username or Password incorrect')
  }

  return (
    <form onSubmit={login}>
      <input name="name" onInput={(e) => setName(e.currentTarget.value)} />
      <input name="password" type="password" onInput={(e) => setPassword(e.currentTarget.value)} />
      <button type="submit">Sign in</button>
    </form>
  )
}
```
