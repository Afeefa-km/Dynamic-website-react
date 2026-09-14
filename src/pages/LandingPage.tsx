import { ImagePlus, Link2, ShoppingBag, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Logo } from '../components/Logo'

const steps = [
  { icon: Store, title: 'Create your store', text: 'Add your name, logo and contact details.' },
  { icon: ImagePlus, title: 'Upload products', text: 'Photos, prices, sizes and stock — SKUs are automatic.' },
  { icon: Link2, title: 'Share your link', text: 'Customers browse, add to cart and order.' },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const pill = 'rounded-full px-5 py-2.5 text-sm font-semibold'

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link to="/dashboard" className={`${pill} bg-brand-700 text-white hover:bg-brand-600`}>Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className={`${pill} text-gray-700 hover:bg-gray-100`}>Sign in</Link>
              <Link to="/signup" className={`${pill} bg-brand-700 text-white hover:bg-brand-600`}>Get started</Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-[2rem] bg-brand-50 px-6 py-16 sm:px-14 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">
            <ShoppingBag className="h-3.5 w-3.5" /> Your shop, online today
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl leading-tight font-extrabold text-brand-900 sm:text-6xl">
            Build a beautiful online store <span className="text-brand-600">without code.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-gray-600">
            Storely gives clothing shops, shoe stores, supermarkets and every small business a simple way to sell online.
          </p>
          <Link to={isAuthenticated ? '/dashboard' : '/signup'} className={`${pill} mt-8 inline-block bg-brand-700 px-8 py-3.5 text-base text-white hover:bg-brand-600`}>
            {isAuthenticated ? 'Go to dashboard' : 'Create your free store'}
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:grid-cols-3 sm:px-6">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="rounded-3xl bg-surface p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-brand-700 p-2.5 text-white"><Icon className="h-5 w-5" /></span>
              <span className="text-sm font-semibold text-gray-400">Step {i + 1}</span>
            </div>
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
