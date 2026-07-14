import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { MoodBadge } from '@/components/journal/mood-badge'
import { MusicEmbed } from '@/components/journal/music-embed'
import { formatDate } from '@/lib/format'
import { excerpt } from '@/lib/format'

type SharedEntry = {
  title: string
  content: string
  mood: string | null
  cover_url: string | null
  music_url: string | null
  created_at: string
}

async function getEntry(slug: string): Promise<SharedEntry | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('entries')
    .select('title, content, mood, cover_url, music_url, created_at, is_public')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single()
  return (data as SharedEntry | null) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = await getEntry(slug)
  if (!entry) return { title: 'Entry not found — Morrow' }
  return {
    title: `${entry.title || 'Untitled'} — Morrow`,
    description: excerpt(entry.content, 155),
  }
}

export default async function SharedEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = await getEntry(slug)
  if (!entry) notFound()

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 text-primary">
            <Image src="/images/morrow-logo.png" alt="Morrow logo" width={40} height={40} />
            <span className="font-serif text-xl font-semibold tracking-tight text-[#c63b3b]">
              Morrow
            </span>
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Start your own
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <article>
          <p className="text-sm text-muted-foreground">
            <time dateTime={entry.created_at}>
              {formatDate(entry.created_at)}
            </time>
          </p>
          <h1 className="mt-2 text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground">
            {entry.title || 'Untitled'}
          </h1>
          {entry.mood && (
            <div className="mt-4">
              <MoodBadge mood={entry.mood} />
            </div>
          )}

          {entry.cover_url && (
            <div className="mt-6 overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.cover_url || '/placeholder.svg'}
                alt=""
                className="w-full object-cover"
              />
            </div>
          )}

          <div className="mt-8 whitespace-pre-wrap text-pretty text-lg leading-relaxed text-foreground">
            {entry.content}
          </div>

          {entry.music_url && (
            <div className="mt-8">
              <MusicEmbed url={entry.music_url} />
            </div>
          )}
        </article>

        <footer className="mt-12 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Written in{' '}
            <Link
              href="/"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Morrow
            </Link>
            {' '}— a quiet place for your story.
          </p>
        </footer>
      </main>
    </div>
  )
}
