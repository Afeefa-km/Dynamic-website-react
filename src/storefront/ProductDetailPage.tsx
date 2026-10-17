import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { labelOf, sizeOptions, type ProductSize } from '../constants/enums'
import { PATH_SEPARATOR } from '../lib/categories'
import { formatMoney, mediaUrl } from '../lib/format'
import { storefrontApi } from '../lib/services'
import { useCart } from './CartContext'
import { useStorefront } from './StorefrontLayout'
import { Accordion, Breadcrumb, QuantityStepper, StoreButton, StoreEmpty, StoreLoader } from './ui'
import { ImageViewer } from './ImageViewer'
import { useWishlist } from './WishlistContext'

export default function ProductDetailPage() {
  const { store } = useStorefront()
  const { productId = '' } = useParams()
  const { add } = useCart()
  const { has, toggle } = useWishlist()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [size, setSize] = useState<ProductSize | null>(null)
  // Index of the photo open in the zoom viewer
  const [viewing, setViewing] = useState<number | null>(null)
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
  const hasSizes = p.variants.some((v) => v.size !== 'None')
  // Products without sizes have a single "None" variant that is selected implicitly
  const variant = hasSizes ? p.variants.find((v) => v.size === size) : p.variants[0]
  const stock = variant?.stockQuantity ?? 0
  const addToBag = () => {
    if (!variant) {
      toast.error('Please select a size')
      return false
    }
    add(p, variant.size, qty)
    return true
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-12">
      <div className="pt-8">
        <Breadcrumb
          items={[
            { label: 'Home', to: base },
            ...p.categoryPath.map((c) => ({ label: c.name, to: `${base}?category=${c.id}` })),
            { label: p.name },
          ]}
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] xl:gap-12">
        {/* Gallery: two-up grid like a lookbook */}
        <div className={`grid gap-2 ${images.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {images.map((img, i) => (
            <div key={i} className="aspect-[3/4] overflow-hidden rounded-sf bg-sf-surface">
              {img ? (
                <button type="button" onClick={() => setViewing(i)} className="block h-full w-full cursor-zoom-in" aria-label={`View photo ${i + 1} of ${p.name} larger`}>
                  <img src={mediaUrl(img)} alt={i === 0 ? p.name : ''} className="h-full w-full object-cover" loading={i > 1 ? 'lazy' : undefined} />
                </button>
              ) : (
                <div className="flex h-full items-center justify-center text-sf-subtle">No image</div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-40 lg:self-start">
          <div className="flex items-start justify-between gap-4">
            <h1 className="sf-heading text-2xl">{p.name}</h1>
            <button onClick={() => toggle(p)} className="p-1" aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={saved}>
              <Heart className={`h-6 w-6 ${saved ? 'fill-sf-text' : ''}`} strokeWidth={1.5} />
            </button>
          </div>

          <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-lg tracking-wide">
            <span>{formatMoney(onSale ? p.discountPrice! : p.price, store.currency)}</span>
            {onSale && (
              <>
                <span className="text-sm text-sf-subtle line-through">{formatMoney(p.price, store.currency)}</span>
                <span className="text-sm text-sf-sale">{Math.round((1 - p.discountPrice! / p.price) * 100)}% off</span>
              </>
            )}
            <span className="text-xs text-sf-subtle">MRP incl. of all taxes</span>
          </p>

          <hr className="my-6 border-sf-border" />

          {hasSizes && (
            <div className="mb-6">
              <p className="text-sm tracking-[0.06em] uppercase">Size</p>
              <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                {p.variants.map((v) => {
                  const soldOut = v.stockQuantity <= 0
                  const selected = size === v.size
                  return (
                    <button
                      key={v.size}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={soldOut}
                      onClick={() => { setSize(v.size); setQty(1) }}
                      className={`flex h-11 min-w-14 items-center justify-center rounded-sf-btn border px-3 text-sm transition ${
                        selected ? 'border-sf-primary bg-sf-primary text-sf-on-primary' : 'border-sf-line hover:border-sf-text'
                      } ${soldOut ? 'cursor-not-allowed text-sf-subtle line-through hover:border-sf-line' : ''}`}
                    >
                      {labelOf(sizeOptions, v.size)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <p className="text-sm tracking-[0.06em] uppercase">Quantity</p>
          <div className="mt-4 flex items-center gap-4">
            {p.inStock ? (
              <>
                <QuantityStepper value={qty} max={variant ? stock : 1} onChange={setQty} />
                {variant && stock <= 5 && <span className="text-sm text-sf-sale">Only {stock} left</span>}
              </>
            ) : (
              <span className="text-sm text-sf-sale">Out of stock</span>
            )}
          </div>

          <hr className="my-6 border-sf-border" />

          <div className="space-y-3">
            <StoreButton className="w-full text-base" disabled={!p.inStock} onClick={addToBag}>
              {p.inStock ? 'Add to bag' : 'Sold out'}
            </StoreButton>
            {p.inStock && (
              <StoreButton variant="outline" className="w-full" onClick={() => { if (addToBag()) navigate(`${base}/cart`) }}>
                Buy now
              </StoreButton>
            )}
          </div>

          <div className="mt-8 border-t border-sf-border">
            <Accordion title="Product Details and Overview" defaultOpen>
              {p.description && <p className="mb-3 whitespace-pre-line">{p.description}</p>}
              {p.details && <p className="mb-3 whitespace-pre-line">{p.details}</p>}
              <dl className="grid grid-cols-[110px_1fr] gap-y-1">
                <dt className="text-sf-subtle">Category</dt><dd>{p.categoryPath.map((c) => c.name).join(PATH_SEPARATOR) || p.categoryName}</dd>
                <dt className="text-sf-subtle">SKU</dt><dd>{p.sku}</dd>
                <dt className="text-sf-subtle">Product code</dt><dd>{p.productCode}</dd>
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
      {viewing !== null && (
        <ImageViewer images={p.images.map((src) => mediaUrl(src))} startIndex={viewing} alt={p.name} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
