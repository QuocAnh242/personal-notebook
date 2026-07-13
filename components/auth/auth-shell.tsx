import Link from 'next/link'
import { BookHeart } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-primary"
          >
            <BookHeart className="size-6" aria-hidden="true" />
            <span className="font-serif text-xl font-semibold tracking-tight">
              Leaflet
            </span>
          </Link>
          <h1 className="text-pretty font-serif text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </div>
        {children}
      </div>
    </main>
  )
}
