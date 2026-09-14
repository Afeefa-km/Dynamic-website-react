import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { labelOf, sizeOptions } from '../constants/enums'
import { formatMoney, mediaUrl } from '../lib/format'
import { storefrontApi } from '../lib/services'
import { useCart } from './CartContext'
import { useStorefront } from './StorefrontLayout'
import { Accordion, Breadcrumb, QuantityStepper, StoreButton, StoreEmpty, StoreLoader } from './ui'
import { useWishlist } from './WishlistContext'

export default function ProductDetailPage() {
  const { store } = useStorefront()
  const { productId = '' } = useParams()
  const { add } = useCart()
  const { has, toggle } = useWishlist()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const base = `/store/${store.slug}`

  const query = useQuery({
    queryKey: ['storefront-product', store.slug, productId],
    queryFn: () => storefrontApi.product(store.slug, productId),
    retry: false,
  })

  if (query.isPending) return <StoreLoader />
  if (query.isError) {
    return (
      <StoreEmpty
        title="Product not available"
        text="It may have been removed or sold out."
        action={<Link to={base}><StoreButton variant="outline">Continue shopping</StoreButton></Link>}
      />
    )
  }

  const p = query.data
  const onSale = !!p.discountPrice && p.discountPrice < p.price
  const saved = has(p.id)
  const images = p.images.length ? p.images : ['']

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-12">
      <div className="pt-8">
        <Breadcrumb items={[{ label: 'Home', to: base }, { label: p.categoryName, to: `${base}?category=${p.categoryId}` }, { label: p.name }]} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] xl:gap-12">
        {/* Gallery: two-up grid like a lookbook */}
        <div className={`grid gap-2 ${images.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {images.map((img, i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-100">
              {img ? (
                <img src={mediaUrl(img)} alt={i === 0 ? p.name : ''} className="h-full w-full object-cover" loading={i > 1 ? 'lazy' : undefined} />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">No image</div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-40 lg:self-start">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl tracking-wide">{p.name}</h1>
            <button onClick={() => toggle(p)} className="p-1" aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={saved}>
              <Heart className={`h-6 w-6 ${saved ? 'fill-neutral-900' : ''}`} strokeWidth={1.5} />
            </button>
          </div>

          <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-lg tracking-wide">
            <span>{formatMoney(onSale ? p.discountPrice! : p.price, store.currency)}</span>
            {onSale && (
              <>
                <span className="text-sm text-neutral-400 line-through">{formatMoney(p.price, store.currency)}</span>
                <span className="text-sm text-red-700">{Math.round((1 - p.discountPrice! / p.price) * 100)}% off</span>
              </>
            )}
            <span className="text-xs text-neutral-400">MRP incl. of all taxes</span>
          </p>

          <hr className="my-6 border-neutral-200" />

          {p.size !== 'None' && (
            <div className="mb-6">
              <p className="text-sm tracking-[0.06em] uppercase">Size</p>
              <div className="mt-4 flex gap-2">
                <span className="flex h-11 min-w-14 items-center justify-center border border-neutral-900 px-3 text-sm">
                  {labelOf(sizeOptions, p.size)}
                </span>
              </div>
            </div>
          )}

          <p className="text-sm tracking-[0.06em] uppercase">Quantity</p>
          <div className="mt-4 flex items-center gap-4">
            {p.inStock ? (
              <>
                <QuantityStepper value={qty} max={p.stockQuantity} onChange={setQty} />
                {p.stockQuantity <= 5 && <span className="text-sm text-red-700">Only {p.stockQuantity} left</span>}
              </>
            ) : (
              <span className="text-sm text-red-700">Out of stock</span>
            )}
          </div>

          <hr className="my-6 border-neutral-200" />

          <div className="space-y-3">
            <StoreButton className="w-full text-base" disabled={!p.inStock} onClick={() => add(p, qty)}>
              {p.inStock ? 'Add to bag' : 'Sold out'}
            </StoreButton>
            {p.inStock && (
              <StoreButton variant="outline" className="w-full" onClick={() => { add(p, qty); navigate(`${base}/cart`) }}>
                Buy now
              </StoreButton>
            )}
          </div>

          <div className="mt-8 border-t border-neutral-200">
            <Accordion title="Product Details and Overview" defaultOpen>
              {p.description && <p className="mb-3 whitespace-pre-line">{p.description}</p>}
              <dl className="grid grid-cols-[110px_1fr] gap-y-1">
                <dt className="text-neutral-400">Category</dt><dd>{p.categoryName}</dd>
                <dt className="text-neutral-400">SKU</dt><dd>{p.sku}</dd>
              </dl>
            </Accordion>
            <Accordion title="Delivery & Return">
              Cash on delivery is available. {store.name} will call you to confirm your order and delivery date.
              For returns or exchanges, please contact the store.
            </Accordion>
            <Accordion title="Contact Us">
              <p>{store.contactPhone}</p>
              <p>{store.contactEmail}</p>
              {store.businessAddress && <p>{store.businessAddress}</p>}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  )
}
