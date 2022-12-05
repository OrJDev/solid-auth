import { DocsLayout } from '~/components'

export default function ApiLayout() {
  return (
    <DocsLayout
      items={[
        {
          heading: 'Base',
          items: ['createSolidAuthClient', 'createSolidAuthHandler'],
        },
        {
          heading: 'Authenticator',
          items: ['introduction', 'isAuthenticated', 'Login', 'Logout'],
        },
        {
          heading: 'AuthClient',
          items: ['Sign In', 'Sign Out'],
        },
        {
          heading: 'Strategies',
          items: ['OAuth2', 'Auth0', 'Credentials'],
        },
        {
          heading: 'Social Strategies',
          items: [
            'Google',
            'Discord',
            'GitHub',
            'Facebook',
            'Microsoft',
            'Strava',
          ],
        },
      ]}
    />
  )
}
