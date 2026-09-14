import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Logo({ to = '/', light = false }: { to?: string; light?: boolean }) {
  return (
    <Link to={to} className={`flex items-center gap-2 text-xl font-extrabold ${light ? 'text-white' : 'text-brand-700'}`}>
      <span className={`rounded-xl p-1.5 ${light ? 'bg-white text-brand-700' : 'bg-brand-700 text-white'}`}>
        <ShoppingBag className="h-5 w-5" />
      </span>
      Storely
    </Link>
  )
}
