import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

/** Small icon button that copies a value and confirms with a toast. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (await copyText(value)) {
      setCopied(true)
      toast.success(`${label} copied`, { id: `copy-${label}-${value}` })
      setTimeout(() => setCopied(false), 1500)
    } else {
      toast.error(`Couldn't copy the ${label}. Please select it and copy it manually.`)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-brand-700"
      aria-label={`Copy ${label} ${value}`}
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-brand-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

/**
 * Copies text to the clipboard. The Clipboard API needs https (or localhost) and permission, so fall back to
 * the older select-and-copy approach when it isn't available.
 */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      area.remove()
    }
  }
}
