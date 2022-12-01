# @solid-auth/credentials

Using the credentials provider let you use your own logic, conditions, etc, if you return a valid user object solid-auth will update the session accordingly, any thrown error will be thrown on the client side and the server will result in 401.

```bash
npm install @solid-auth/credentials
```

### Setting up the credentials provider

```ts
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
    return {
      email: user.email,
      id: user.id,
    }
  })
)
```

### Using the credentials provider

```ts
try {
  await authClient.login('credentials', {
    input: {
      password: myPassword,
      email: myEmail,
    },
  })
  // if you are using routeData to get the currentUser, make sure to refetch the route data
  await refetchRouteData()
} catch (e) {
  console.log('auth error', e)
}
```
