import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Music } from 'lucide-react'
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

  let spotifyTrack = null
  if (entry.music_url && entry.music_url.includes('spotify.com')) {
    try {
      spotifyTrack = await getSpotifyTrackDetails(entry.music_url)
    } catch (e) {
      console.error('Failed to get Spotify details for share page:', e)
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4 animate-in fade-in duration-500">
          <Link href="/" className="flex items-center gap-3 text-primary transition-all duration-300 hover:opacity-80">
            <Image src="/images/morrow-logo.png" alt="Morrow logo" width={40} height={40} />
            <span className="font-serif text-xl font-semibold tracking-tight text-[#c63b3b]">
              Morrow
            </span>
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline transition-all duration-300"
          >
            Start your own
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-10 animate-in fade-in duration-500">
        <article className="space-y-8">
          <div className="animate-slide-in" style={{ animationDelay: '100ms' }}>
            <p className="text-sm text-muted-foreground/80">
              <time dateTime={entry.created_at}>
                {formatDate(entry.created_at)}
              </time>
            </p>
            <h1 className="mt-3 text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground">
              {entry.title || 'Untitled'}
            </h1>
            {entry.mood && (
              <div className="mt-4 animate-scale-in" style={{ animationDelay: '200ms' }}>
                <MoodBadge mood={entry.mood} />
              </div>
            )}
          </div>

          {entry.cover_url && (
            <div className="group overflow-hidden rounded-xl border border-border/50 shadow-sm transition-all duration-300 hover:shadow-md animate-slide-in" style={{ animationDelay: '150ms' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.cover_url || '/placeholder.svg'}
                alt=""
                className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          )}

          <div className="prose prose-sm max-w-none animate-slide-in" style={{ animationDelay: '200ms' }}>
            <div className="whitespace-pre-wrap text-pretty text-lg leading-relaxed text-foreground">
              {entry.content}
            </div>
          </div>

          {entry.music_url && (
            <div className="animate-slide-in" style={{ animationDelay: '250ms' }}>
              <MusicEmbed url={entry.music_url} />
            </div>
          )}
        </article>

        <footer className="mt-12 border-t border-border/30 pt-8 text-center animate-slide-in" style={{ animationDelay: '300ms' }}>
          <p className="text-sm text-muted-foreground/80">
            Written in{' '}
            <Link
              href="/"
              className="font-medium text-primary underline-offset-4 hover:underline transition-all duration-300"
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
