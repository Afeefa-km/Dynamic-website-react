import type { ReactNode } from 'react'

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-300 bg-surface px-6 py-14 text-center">
      <div className="mb-4 rounded-full bg-brand-50 p-4 text-brand-700">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
