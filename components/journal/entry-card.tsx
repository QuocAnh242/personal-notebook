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
          {entry.music_url && (
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
        {entry.mood && (
          <div className="mt-3 transition-all duration-300 group-hover:scale-105 origin-left">
            <MoodBadge mood={entry.mood} />
          </div>
        )}
      </div>
    </Link>
  )
}
