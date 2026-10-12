import EmptyState from '../components/ui/EmptyState'
export default function NotFound() {
  return <div className="container-x py-16"><EmptyState title="Page not found" text="The page you are looking for does not exist." action="Go home" to="/" /></div>
}
