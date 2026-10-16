import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { childrenOf } from '../lib/categories'
import { mediaUrl } from '../lib/format'
import type { Storefront } from '../types/api'
import type { ThemeDefinition } from './themes'

interface Props {
  store: Storefront
  theme: ThemeDefinition
  /** Product photos, newest first; used where the owner hasn't uploaded enough cover images */
  productImages: string[]
}

/**
 * The home page banner. Each theme lays it out differently, but every version holds the same things:
 * the store name, its description, a "shop" action that jumps to the product grid, and links into the
 * top-level categories. Nothing here is required to shop; it is presentation only.
 */
export function StoreHero({ store, theme, productImages }: Props) {
  // The owner's cover images fill the theme's slots in order; product photos fill any gaps
  const covers = store.coverImages.slice(0, theme.coverSlots)
  const images = [...covers, ...productImages.filter((src) => !covers.includes(src))]
  const base = `/store/${store.slug}`
  const intro = store.businessDescription || 'New arrivals, picked for you. Discover the latest from our collection.'
  const categories = childrenOf(store.categories, null)
  const shopNow = () => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const photo = (src: string | undefined, className: string, alt = '') =>
    src ? (
      <img src={mediaUrl(src)} alt={alt} className={`h-full w-full object-cover ${className}`} />
    ) : (
      <div className={`h-full w-full bg-sf-surface ${className}`} aria-hidden />
    )

  switch (theme.hero) {
    case 'editorial':
      return (
        <section className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-12">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <h1 className="sf-heading text-4xl leading-[1.05] sm:text-6xl">{store.name}</h1>
            <div className="lg:pb-2">
              <p className="max-w-sm text-sm leading-relaxed text-sf-muted uppercase">{intro}</p>
              <button
                onClick={shopNow}
                className="mt-5 inline-flex h-11 items-center gap-6 rounded-sf-btn border border-sf-text px-5 text-xs font-semibold tracking-wide uppercase transition-colors hover:bg-sf-text hover:text-sf-bg"
              >
                Shop new arrivals <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="relative mt-8 h-64 overflow-hidden rounded-sf sm:h-[26rem]">
            {photo(images[0], '', store.name)}
            {categories.length > 0 && (
              <div className="absolute right-4 bottom-4 left-4 flex flex-wrap gap-2">
                {categories.slice(0, 5).map((c) => (
                  <Link key={c.id} to={`${base}?category=${c.id}`} className="rounded-full bg-sf-accent px-4 py-1.5 text-xs font-semibold text-sf-on-accent uppercase">
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )

    case 'banner':
      return (
        <section className="border-b border-sf-border bg-sf-band text-sf-on-band">
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
            <div className="flex flex-col justify-center px-4 py-14 sm:px-12 lg:py-24">
              <p className="sf-label flex items-center gap-3 text-xs text-sf-accent">
                New collection <span className="h-px w-12 bg-sf-accent" aria-hidden />
              </p>
              <h1 className="sf-heading mt-6 text-4xl leading-tight sm:text-6xl">{store.name}</h1>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-sf-muted">{intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={shopNow} className="inline-flex h-12 items-center gap-3 rounded-sf-btn bg-sf-primary px-6 text-xs font-medium tracking-[0.1em] text-sf-on-primary uppercase hover:opacity-90">
                  Shop now <ArrowRight className="h-4 w-4" />
                </button>
                {categories[0] && (
                  <Link
                    to={`${base}?category=${categories[0].id}`}
                    className="inline-flex h-12 items-center rounded-sf-btn border border-sf-line px-6 text-xs font-medium tracking-[0.1em] uppercase hover:border-sf-text"
                  >
                    Explore {categories[0].name}
                  </Link>
                )}
              </div>
            </div>
            <div className="h-72 sm:h-96 lg:h-auto lg:min-h-[32rem]">{photo(images[0], '', store.name)}</div>
          </div>
        </section>
      )

    case 'split':
      return (
        <section className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-12">
          <div className="grid overflow-hidden rounded-sf md:grid-cols-2">
            <div className="h-72 sm:h-[30rem]">{photo(images[0], '', store.name)}</div>
            <div className="flex flex-col items-start justify-center gap-6 bg-sf-band px-8 py-12 text-sf-on-band sm:px-14">
              <h1 className="sf-heading text-3xl leading-snug sm:text-5xl">{store.name}</h1>
              <p className="max-w-sm text-sm leading-relaxed opacity-80">{intro}</p>
              <button onClick={shopNow} className="sf-heading border border-current px-6 py-2.5 text-sm transition-colors hover:bg-sf-text hover:text-sf-bg">
                Explore collection
              </button>
            </div>
          </div>
          {images.length > 1 && (
            // One extra photo spans the full width; two sit side by side
            <div className={`mt-4 grid gap-4 ${images.length > 2 ? 'grid-cols-2' : ''}`}>
              {images.slice(1, 3).map((src) => (
                <div key={src} className="aspect-[16/9] overflow-hidden rounded-sf">{photo(src, '')}</div>
              ))}
            </div>
          )}
        </section>
      )

    case 'atelier':
      return (
        <section className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col justify-center">
              <span className="sf-label w-fit bg-sf-band px-2 py-1 text-[11px] text-sf-on-band">Every fashion moment</span>
              <h1 className="sf-heading mt-5 text-4xl leading-[1.1] break-words sm:text-6xl">{store.name}</h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-sf-muted">{intro}</p>
              <button onClick={shopNow} className="sf-label mt-6 inline-flex h-11 w-fit items-center gap-2 bg-sf-primary px-5 text-xs text-sf-on-primary hover:opacity-90">
                Shop now <ArrowUpRight className="h-4 w-4" />
              </button>
              {categories.length > 0 && (
                <ol className="mt-10 max-w-sm">
                  {categories.slice(0, 6).map((c, i) => (
                    <li key={c.id}>
                      <Link to={`${base}?category=${c.id}`} className="sf-label flex gap-6 border-b border-sf-line py-2 text-xs hover:text-sf-accent">
                        <span className="text-sf-muted">{String(i + 1).padStart(3, '0')}</span>
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="grid grid-cols-[0.6fr_1fr] items-end gap-4">
              <div className="aspect-[3/4] overflow-hidden">{photo(images[1], '')}</div>
              <div className="h-80 overflow-hidden sm:h-[30rem]">{photo(images[0], '', store.name)}</div>
            </div>
          </div>
        </section>
      )

    default:
      return null
  }
}
