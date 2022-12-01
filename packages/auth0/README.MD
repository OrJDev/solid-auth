# @solid-auth/auth0

```bash
npm install @solid-auth/auth0
```

The Auth0 strategy is used to authenticate users against an Auth0 account. It extends the OAuth2Strategy.

```ts
authenticator.use(
  new Auth0Strategy(
    {
      callbackURL: 'https://example.com/auth/auth0/callback',
      clientID: 'YOUR_AUTH0_CLIENT_ID',
      clientSecret: 'YOUR_AUTH0_CLIENT_SECRET',
      domain: 'YOUR_TENANT.us.auth0.com',
    },
    async ({ accessToken, refreshToken, extraParams, profile }) => {
      // Get the user data from your DB or API using the tokens and profile
      return User.findOrCreate({ email: profile.emails[0].value })
    }
  )
)
```
