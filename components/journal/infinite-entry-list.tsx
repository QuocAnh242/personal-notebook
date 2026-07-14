'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { EntryCard, type EntryListItem } from './entry-card'
import { Loader2 } from 'lucide-react'

interface InfiniteEntryListProps {
  initialEntries: EntryListItem[]
  fetchAction: (offset: number, limit: number) => Promise<EntryListItem[]>
  limit?: number
  baseHref?: string
}

export function InfiniteEntryList({
  initialEntries,
  fetchAction,
  limit = 20,
  baseHref = '/journal'
}: InfiniteEntryListProps) {
  const [entries, setEntries] = useState<EntryListItem[]>(initialEntries)
  const [hasMore, setHasMore] = useState(initialEntries.length === limit)
  const [isLoading, setIsLoading] = useState(false)
  
  const observerTarget = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextEntries = await fetchAction(entries.length, limit)
      
      if (nextEntries.length > 0) {
        setEntries((prev) => [...prev, ...nextEntries])
      }
      
      if (nextEntries.length < limit) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more entries:', error)
    } finally {
      setIsLoading(false)
    }
  }, [entries.length, fetchAction, hasMore, isLoading, limit])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="flex flex-col gap-8">
      {entries.map((entry, index) => (
        <div key={entry.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationFillMode: 'both' }}>
          <EntryCard entry={entry} href={baseHref === '/explore' ? `/explore/${entry.id}` : undefined} />
        </div>
      ))}
      
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground/50" />
        </div>
      )}
      
      {!hasMore && entries.length > 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground/50 italic">
          You've reached the end.
        </div>
      )}
    </div>
  )
}
