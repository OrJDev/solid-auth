# @solid-auth/socials

> A collection of Solid Auth strategies for Oauth2 Social logins.

Current strategies:

- Discord
- Github
- Google
- Facebook
- Microsoft

```bash
npm install @solid-auth/socials
```

### Setting up a social provider

```ts
authenticator.use(
  new DiscordStrategy(
    {
      clientID: serverEnv.DISCORD_CLIENT_ID,
      clientSecret: process.env.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.SITE_URL + '/api/auth/discord/callback',
      prompt: 'none',
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

### Using a social provider

```ts
authClient.login('discord', {
  successRedirect: '/',
  failureRedirect: '/',
})
```
