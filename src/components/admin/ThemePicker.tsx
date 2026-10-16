import { Check, ExternalLink, Images } from 'lucide-react'
import { useEffect } from 'react'
import type { StoreTheme } from '../../constants/enums'
import { loadThemeFonts, themeList, themeStyle, type ThemeDefinition } from '../../storefront/themes'

interface Props {
  value: StoreTheme
  onChange: (theme: StoreTheme) => void
  storeName: string
  /** When set, each theme gets a link to preview the live store in that theme */
  storeSlug?: string
}

const GROUPS: { category: ThemeDefinition['category']; title: string; text: string }[] = [
  { category: 'Dress', title: 'Dress', text: 'Designed for fashion and clothing stores.' },
  { category: 'Default', title: 'Default', text: 'The original Storely look.' },
]

/** Theme cards grouped by category, each with a miniature of the store drawn in that theme. */
export function ThemePicker({ value, onChange, storeName, storeSlug }: Props) {
  // Load every theme's fonts so the previews show the real typography
  useEffect(() => themeList.forEach(loadThemeFonts), [])

  return (
    <div className="space-y-6">
      {GROUPS.map((group) => (
        <section key={group.category}>
          <h3 className="text-sm font-semibold text-gray-900">{group.title}</h3>
          <p className="text-xs text-gray-500">{group.text}</p>
          <div role="radiogroup" aria-label={`${group.title} themes`} className="mt-3 grid gap-4 sm:grid-cols-2">
            {themeList
              .filter((t) => t.category === group.category)
              .map((theme) => {
                const selected = value === theme.id
                return (
                  <div
                    key={theme.id}
                    className={`relative rounded-2xl border bg-white p-2 transition ${
                      selected ? 'border-brand-700 ring-2 ring-brand-100' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <button type="button" role="radio" aria-checked={selected} onClick={() => onChange(theme.id)} className="block w-full text-left outline-none">
                      <ThemePreview theme={theme} storeName={storeName} />
                      <div className="flex items-start gap-2 px-1.5 pt-3 pb-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">{theme.name}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{theme.description}</p>
                          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                            <Images className="h-3 w-3" />
                            {theme.coverSlots === 0 ? 'No cover images' : `Uses ${theme.coverSlots} cover image${theme.coverSlots === 1 ? '' : 's'}`}
                          </p>
                        </div>
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-gray-300'
                          }`}
                          aria-hidden
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </span>
                      </div>
                    </button>
                    {storeSlug && (
                      <a
                        href={`/store/${storeSlug}?preview=${theme.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mx-1.5 mb-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                      >
                        Preview your store <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )
              })}
          </div>
        </section>
      ))}
    </div>
  )
}

/** A small drawing of a store page in the given theme, built from the same tokens the storefront uses. */
export function ThemePreview({ theme, storeName }: { theme: ThemeDefinition; storeName: string }) {
  const photo = 'bg-[linear-gradient(135deg,var(--sf-surface),var(--sf-line))]'
  const heading = <p className="sf-heading truncate text-[15px] leading-tight">{storeName}</p>
  const button = <span className="inline-block rounded-sf-btn bg-sf-primary px-2 py-1 text-[7px] text-sf-on-primary uppercase">Shop now</span>

  return (
    <div style={themeStyle(theme)} className="pointer-events-none aspect-[16/11] overflow-hidden rounded-xl border border-gray-100 bg-sf-bg font-sf-body text-sf-text select-none" aria-hidden>
      {theme.serviceBar && <div className="h-2 bg-sf-band" />}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="truncate font-sf-display text-[9px] tracking-[0.12em] uppercase">{storeName}</span>
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-sf-text" />
          <span className="h-1.5 w-1.5 rounded-full bg-sf-text" />
        </span>
      </div>

      <div className="px-3">
        {theme.hero === 'editorial' && (
          <>
            {heading}
            <div className={`relative mt-1.5 h-12 rounded-sf ${photo}`}>
              <span className="absolute bottom-1 left-1 rounded-full bg-sf-accent px-1.5 text-[6px] text-sf-on-accent uppercase">New</span>
            </div>
          </>
        )}
        {theme.hero === 'banner' && (
          <div className="grid h-[4.5rem] grid-cols-2 bg-sf-band text-sf-on-band">
            <div className="flex flex-col justify-center gap-1 px-2">
              <span className="h-px w-5 bg-sf-accent" />
              {heading}
              <span>{button}</span>
            </div>
            <div className={photo} />
          </div>
        )}
        {theme.hero === 'split' && (
          <div className="grid h-[4.5rem] grid-cols-2 overflow-hidden rounded-sf">
            <div className={photo} />
            <div className="flex flex-col justify-center gap-1 bg-sf-band px-2 text-sf-on-band">
              {heading}
              <span className="w-fit border border-current px-1.5 text-[6px] uppercase">Explore</span>
            </div>
          </div>
        )}
        {theme.hero === 'atelier' && (
          <div className="grid h-[4.5rem] grid-cols-[1fr_0.8fr] gap-2">
            <div className="flex flex-col justify-center gap-1">
              {heading}
              <span>{button}</span>
              <span className="sf-label text-[5px] text-sf-muted">001 New · 002 Dresses</span>
            </div>
            <div className={photo} />
          </div>
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5 px-3">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className={`aspect-[3/4] rounded-sf ${photo}`} />
            <div className="mt-1 h-1 w-3/4 rounded bg-sf-muted/40" />
          </div>
        ))}
      </div>
    </div>
  )
}
