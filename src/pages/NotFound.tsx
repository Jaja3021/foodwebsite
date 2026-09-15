import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-offwhite px-5 text-center">
      <p className="font-display text-8xl font-extrabold text-gold">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-body/60">
        The plate you're looking for isn't on the menu. Let's get you back to something delicious.
      </p>
      <Link to="/home" className="mt-6">
        <Button>Back to Home</Button>
      </Link>
    </div>
  )
}
