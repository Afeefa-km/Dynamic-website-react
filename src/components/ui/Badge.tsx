import type { ReactNode } from 'react'
const tones = {
  green: 'bg-brand-50 text-brand-700',
  gray: 'bg-gray-100 text-gray-700',
  yellow: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-sky-50 text-sky-700',
}

export type BadgeTone = keyof typeof tones

export function Badge({ tone = 'gray', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
}
