import type { ReactNode } from 'react'
import { Logo } from '../../components/Logo'

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-700 p-12 text-white lg:flex">
        <Logo light />
        <div>
          <h2 className="text-4xl leading-tight font-bold">
            Launch your online store <br />
            <span className="text-accent">in minutes.</span>
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            Add your products, share your store link, and start taking orders. No code, no fuss.
          </p>
        </div>
        <p className="text-sm text-brand-100">© {new Date().getFullYear()} Storely</p>
      </div>
      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 mb-8 text-sm text-gray-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
