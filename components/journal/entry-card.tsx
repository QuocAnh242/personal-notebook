import Link from 'next/link'
import { Globe, Music } from 'lucide-react'
import { MoodBadge } from '@/components/journal/mood-badge'
import { formatDate, excerpt } from '@/lib/format'

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

export function EntryCard({ entry }: { entry: EntryListItem }) {
  const preview = excerpt(entry.content)
  return (
    <Link
      href={`/journal/${entry.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-primary/50"
    >
      {entry.cover_url && (
        <div className="aspect-[16/7] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.cover_url || '/placeholder.svg'}
            alt=""
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <time dateTime={entry.created_at}>{formatDate(entry.created_at)}</time>
          {entry.music_url && (
            <Music className="size-3.5" aria-label="Has a song" />
          )}
          {entry.is_public && (
            <Globe className="size-3.5" aria-label="Shared publicly" />
          )}
        </div>
        <h3 className="text-pretty font-serif text-xl font-semibold leading-snug text-foreground">
          {entry.title || 'Untitled'}
        </h3>
        {preview && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {preview}
          </p>
        )}
        {entry.mood && (
          <div className="mt-3">
            <MoodBadge mood={entry.mood} />
          </div>
        )}
      </div>
    </Link>
  )
}
