# @solid-auth/oauth2

A strategy to use and implement OAuth2 framework for authentication with federated services like Google, Facebook, GitHub, etc.

```bash
npm install @solid-auth/oauth2
```

```ts
authenticator.use(
  new OAuth2Strategy(
    {
      authorizationURL: 'https://provider.com/oauth2/authorize',
      tokenURL: 'https://provider.com/oauth2/token',
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: 'https://example.app/auth/callback',
    },
    async ({ accessToken, refreshToken, extraParams, profile, context }) => {
      // here you can use the params above to get the user and return it
      // what you do inside this and how you find the user is up to you
      return await getUser(
        accessToken,
        refreshToken,
        extraParams,
        profile,
        context
      )
    }
  )
)
```
