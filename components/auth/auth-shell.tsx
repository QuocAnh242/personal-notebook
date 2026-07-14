import Link from 'next/link'
import Image from 'next/image'

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
            className="mb-6 flex flex-col items-center gap-4 hover:opacity-90 transition-opacity"
          >
            <Image src="/images/morrow-logo.png" alt="Morrow logo" width={128} height={128} className="drop-shadow-sm" />

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
