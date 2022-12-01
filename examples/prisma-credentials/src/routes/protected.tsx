import { withProtected } from '../layouts/Protected'

export const { routeData, Page } = withProtected((user) => {
  return <h1>Hey user wit id - {user.id}</h1>
})

export default Page
