import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatMoney, mediaUrl } from '../lib/format'
import type { StorefrontProduct } from '../types/api'
import { useWishlist } from './WishlistContext'

export function ProductCard({ product, slug, currency }: { product: StorefrontProduct; slug: string; currency: string }) {
  const { has, toggle } = useWishlist()
  const saved = has(product.id)
  const onSale = !!product.discountPrice && product.discountPrice < product.price
  const href = `/store/${slug}/p/${product.id}`

  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sf bg-sf-surface">
        <Link to={href} className="block h-full">
          {product.images[0] ? (
            <img
              src={mediaUrl(product.images[0])}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-sf-subtle">No image</div>
          )}
        </Link>
        <div className="pointer-events-none absolute top-0 left-0 flex flex-col items-start gap-1">
          {product.isNew && <span className="bg-sf-primary px-1.5 py-1 text-[11px] leading-none text-sf-on-primary">New</span>}
          {!product.inStock && <span className="bg-sf-bg px-1.5 py-1 text-[11px] leading-none text-sf-muted">Sold out</span>}
        </div>
        <button
          onClick={() => toggle(product)}
          className="absolute top-3 right-3 p-1"
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={saved}
        >
          <Heart className={`h-[22px] w-[22px] ${saved ? 'fill-sf-text' : ''}`} strokeWidth={1.5} />
        </button>
      </div>
      <Link to={href} className="block">
        <p className="mt-5 truncate text-[15px] tracking-wide">{product.name}</p>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-[15px] tracking-wide">
          <span>{formatMoney(onSale ? product.discountPrice! : product.price, currency)}</span>
          {onSale && (
            <>
              <span className="text-sm text-sf-subtle line-through">{formatMoney(product.price, currency)}</span>
              <span className="text-sm text-sf-sale">{Math.round((1 - product.discountPrice! / product.price) * 100)}% off</span>
            </>
          )}
        </p>
      </Link>
    </div>
  )
}
