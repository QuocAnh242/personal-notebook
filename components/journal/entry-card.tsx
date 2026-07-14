import Link from 'next/link'
import { Globe, Music } from 'lucide-react'
import { MoodBadge } from '@/components/journal/mood-badge'
import { formatDate, excerpt } from '@/lib/format'
import { getSpotifyTrackDetails } from '@/app/journal/actions'
import { EntryCardMusic } from '@/components/journal/entry-card-music'

export type EntryListItem = {
  id: string
  title: string
  content: string
  mood: string | null
  cover_url: string | null
  music_url: string | null
  is_public: boolean
  created_at: string
}

export async function EntryCard({ entry, href }: { entry: EntryListItem; href?: string }) {
  const preview = excerpt(entry.content)
  
  // Try to fetch Spotify track details for a custom badge
  let spotifyTrack = null
  if (entry.music_url && entry.music_url.includes('spotify.com')) {
    try {
      spotifyTrack = await getSpotifyTrackDetails(entry.music_url)
    } catch (e) {
      console.error('Failed to get Spotify details for card:', e)
    }
  }

  return (
    <Link
      href={href || `/journal/${entry.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:translate-y-[-2px]"
    >
      {entry.cover_url && (
        <div className="aspect-[16/7] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.cover_url || '/placeholder.svg'}
            alt=""
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground transition-all duration-300 group-hover:text-foreground/70">
          <time dateTime={entry.created_at}>{formatDate(entry.created_at)}</time>
          {entry.music_url && !spotifyTrack && (
            <Music className="size-3.5 transition-transform duration-300 group-hover:scale-110" aria-label="Has a song" />
          )}
          {entry.is_public && (
            <Globe className="size-3.5 transition-transform duration-300 group-hover:scale-110" aria-label="Shared publicly" />
          )}
        </div>
        <h3 className="text-pretty font-serif text-xl font-semibold leading-snug text-foreground transition-all duration-300 group-hover:text-primary">
          {entry.title || 'Untitled'}
        </h3>
        {preview && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground transition-all duration-300 group-hover:text-muted-foreground/90">
            {preview}
          </p>
        )}
        
        {/* Footer info: Mood & Spotify track details */}
        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          {entry.mood ? (
            <div className="transition-all duration-300 group-hover:scale-105 origin-left">
              <MoodBadge mood={entry.mood} />
            </div>
          ) : (
            <div />
          )}

          {spotifyTrack && (
            spotifyTrack.previewUrl ? (
              <EntryCardMusic
                previewUrl={spotifyTrack.previewUrl}
                title={spotifyTrack.name}
                artists={spotifyTrack.artists}
                albumArt={spotifyTrack.albumArt}
              />
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-50/50 dark:bg-emerald-950/20 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400 max-w-[240px] truncate transition-all duration-300 group-hover:border-emerald-500/30 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30">
                {spotifyTrack.albumArt ? (
                  <img
                    src={spotifyTrack.albumArt}
                    alt={spotifyTrack.album}
                    className="size-4 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <Music className="size-3 shrink-0" />
                )}
                <span className="truncate font-medium">
                  {spotifyTrack.name} • {spotifyTrack.artists}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </Link>
  )
}
