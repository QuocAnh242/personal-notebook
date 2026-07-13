import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { BookHeart, Heart, PenLine, Share2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/journal')

  const features = [
    {
      icon: PenLine,
      title: 'Write it all down',
      body: 'Your music, your love, your sadness, your anger, your plans — one honest page at a time.',
    },
    {
      icon: Sparkles,
      title: 'A little encouragement',
      body: 'Open your notebook to a gentle reminder that you are becoming who you want to be.',
    },
    {
      icon: Share2,
      title: 'Share when you want',
      body: 'Keep everything private, or share a single entry with a link when you want to be seen.',
    },
  ]

  return (
    <div className="min-h-svh bg-background">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2 text-primary">
          <BookHeart className="size-5" aria-hidden="true" />
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Leaflet
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/sign-up">Start writing</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Heart className="size-3.5 text-primary" aria-hidden="true" />
              A private notebook for becoming
            </span>
            <h1 className="mt-5 text-balance font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Your story, written softly.
            </h1>
            <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              A quiet, modern diary for your thoughts, your favourite songs,
              your loves and losses, your plans and your lore. Write to become
              better — and share what you choose.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">Begin your notebook</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">I already have one</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
              <Image
                src="/images/hero-notebook.png"
                alt="An open vintage notebook on a warm wooden desk with a pen and dried flowers"
                width={1200}
                height={900}
                priority
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 pb-20">
          <div className="grid gap-5 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <f.icon className="size-6 text-primary" aria-hidden="true" />
                <h2 className="mt-4 font-serif text-xl font-semibold text-foreground">
                  {f.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="font-serif text-base text-foreground">Leaflet</span>
          <span>A quiet place for your story. You are worthy of being loved.</span>
        </div>
      </footer>
    </div>
  )
}
