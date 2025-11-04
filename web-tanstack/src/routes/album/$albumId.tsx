import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/album/$albumId')({
  component: RouteComponent,
})

function RouteComponent() {
  const {albumId} = Route.useParams()

  return <div>Hello "/album/{albumId}"!</div>
}
