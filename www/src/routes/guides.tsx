import { DocsLayout } from '~/components'

export default function GuidesLayout() {
  return (
    <DocsLayout
      items={[
        {
          heading: 'Get started',
          items: ['Introduction', 'Installation'],
        },
        {
          heading: 'Main concepts',
          items: ['Auth Client', 'Client Usage', 'Authenticator'],
        },
        {
          heading: 'Others',
          items: ['TypeScript', 'FAQ'],
        },
      ]}
      lowerCase
    />
  )
}
