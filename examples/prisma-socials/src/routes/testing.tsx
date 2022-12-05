import { type VoidComponent } from 'solid-js'
import { Title } from 'solid-start'
import { useSession } from '~/auth'

const Testing: VoidComponent = () => {
  const user = useSession()
  return (
    <>
      <Title>Testing</Title>
      <pre>{JSON.stringify(user())}</pre>
    </>
  )
}

export default Testing
