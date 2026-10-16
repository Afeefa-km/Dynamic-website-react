import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { storeApi } from '../../lib/services'
import { THEMES } from '../../storefront/themes'
import type { Store } from '../../types/api'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { ThemePicker } from './ThemePicker'

interface Props {
  store: Store
  /** Called after saving a theme (with the updated store) or skipping (with nothing) */
  onDone: (updated?: Store) => void
}

/** First-run step after the store is created. Skipping keeps the default theme; it can be changed later. */
export function ThemeOnboardingModal({ store, onDone }: Props) {
  const [theme, setTheme] = useState(store.theme)
  const mutation = useMutation({ mutationFn: () => storeApi.updateTheme(theme), onSuccess: (updated) => onDone(updated) })

  return (
    <Modal
      open
      size="xl"
      onClose={mutation.isPending ? undefined : () => onDone()}
      title="Choose a look for your store"
      subtitle="Every theme has the same features, so you can switch any time from Store settings."
      footer={
        <>
          <Button variant="ghost" onClick={() => onDone()} disabled={mutation.isPending} className="mr-auto">
            Skip for now
          </Button>
          <Button onClick={() => (theme === store.theme ? onDone() : mutation.mutate())} loading={mutation.isPending}>
            Use {THEMES[theme].name}
          </Button>
        </>
      }
    >
      <ThemePicker value={theme} onChange={setTheme} storeName={store.name} />
    </Modal>
  )
}
