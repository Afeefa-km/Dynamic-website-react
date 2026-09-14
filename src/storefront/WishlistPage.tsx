import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatMoney, mediaUrl } from '../lib/format'
import { useStorefront } from './StorefrontLayout'
import { Breadcrumb, StoreButton, StoreEmpty } from './ui'
import { useWishlist } from './WishlistContext'

export default function WishlistPage() {
  const { store } = useStorefront()
  const { items, remove } = useWishlist()
  const base = `/store/${store.slug}`

  if (items.length === 0) {
    return (
      <StoreEmpty
        title="Your wishlist is empty"
        text="Tap the heart on any product to save it for later."
        action={<Link to={base}><StoreButton variant="outline">Explore products</StoreButton></Link>}
      />
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-12">
      <div className="pt-8">
        <Breadcrumb items={[{ label: 'Home', to: base }, { label: 'Wishlist' }]} />
      </div>
      <h1 className="mt-8 text-2xl tracking-wide">Wishlist <span className="text-neutral-400">({items.length})</span></h1>
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 lg:grid-cols-4">
        {items.map((i) => {
          const onSale = !!i.discountPrice && i.discountPrice < i.price
          return (
            <div key={i.productId}>
              <div className="relative aspect-[3/4] bg-neutral-100">
                <Link to={`${base}/p/${i.productId}`} className="block h-full">
                  {i.image && <img src={mediaUrl(i.image)} alt={i.name} className="h-full w-full object-cover" />}
                </Link>
                <button onClick={() => remove(i.productId)} className="absolute top-3 right-3 bg-white p-1" aria-label={`Remove ${i.name}`}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Link to={`${base}/p/${i.productId}`} className="block">
                <p className="mt-5 truncate text-[15px] tracking-wide">{i.name}</p>
                <p className="mt-3 text-[15px]">{formatMoney(onSale ? i.discountPrice! : i.price, store.currency)}</p>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
