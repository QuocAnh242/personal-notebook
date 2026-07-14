'use client'

import { useRef, useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  Copy,
  ImagePlus,
  Loader2,
  Trash2,
  X,
  Search,
  Music,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { MOODS } from '@/lib/moods'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  createEntry,
  updateEntry,
  deleteEntry,
  type EntryInput,
  shareEntryViaEmail,
  uploadCoverAndModerate,
  searchSpotifyTracks,
} from '@/app/journal/actions'
import { ShareEmailDialog } from './share-email-dialog'

export type EditableEntry = {
  id: string
  title: string
  content: string
  mood: string | null
  cover_url: string | null
  music_url: string | null
  is_public: boolean
  shared_with_friends: boolean
  share_slug: string | null
}

export function EntryEditor({
  entry,
  userId,
}: {
  entry?: EditableEntry
  userId: string
}) {
  const router = useRouter()
  const [title, setTitle] = useState(entry?.title ?? '')
  const [content, setContent] = useState(entry?.content ?? '')
  const [mood, setMood] = useState<string | null>(entry?.mood ?? null)
  const [coverUrl, setCoverUrl] = useState<string | null>(
    entry?.cover_url ?? null,
  )
  const [musicUrl, setMusicUrl] = useState(entry?.music_url ?? '')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; artists: string; album: string; albumArt: string; url: string }[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.startsWith('http')) {
      setSearchResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchSpotifyTracks(searchQuery)
        setSearchResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 450)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const [isPublic, setIsPublic] = useState(entry?.is_public ?? false)
  const [sharedWithFriends, setSharedWithFriends] = useState(entry?.shared_with_friends ?? false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = Boolean(entry)

  const shareUrl =
    entry?.share_slug && typeof window !== 'undefined'
      ? `${window.location.origin}/share/${entry.share_slug}`
      : null

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          const res = await uploadCoverAndModerate(base64, file.name)
          if (res?.error) {
            toast.error(res.error)
          } else if (res?.publicUrl) {
            setCoverUrl(res.publicUrl)
            toast.success('Cover image uploaded!')
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Could not upload the image.')
        } finally {
          setUploading(false)
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read file.')
        setUploading(false)
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not upload the image.',
      )
      setUploading(false)
    }
  }

  const buildInput = (): EntryInput => ({
    title,
    content,
    mood,
    coverUrl,
    musicUrl,
    isPublic,
    sharedWithFriends,
  })

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      toast.error('Write a title or a few words first.')
      return
    }
    startTransition(async () => {
      if (isEditing && entry) {
        const res = await updateEntry(entry.id, buildInput())
        if (res?.error) {
          toast.error(res.error)
          return
        }
        toast.success('Saved.')
        router.refresh()
      } else {
        const res = await createEntry(buildInput())
        if (res?.error) toast.error(res.error)
      }
    })
  }

  const handleDelete = () => {
    if (!entry) return
    if (!confirm('Delete this entry? This cannot be undone.')) return
    startTransition(async () => {
      const res = await deleteEntry(entry.id)
      if (res?.error) toast.error(res.error)
    })
  }

  const copyShareLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Share link copied.')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 animate-in fade-in duration-500">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/journal"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="text-destructive hover:text-destructive transition-all duration-200"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          <Button onClick={handleSave} size="sm" disabled={isPending} className="transition-all duration-200">
            {isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {isEditing ? 'Save' : 'Publish to notebook'}
          </Button>
        </div>
      </div>

      {/* Cover */}
      <div className="mb-6 animate-slide-in" style={{ animationDelay: '100ms' }}>
        {coverUrl ? (
          <div className="group relative overflow-hidden rounded-xl border border-border shadow-sm transition-all duration-300 hover:shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl || '/placeholder.svg'}
              alt="Entry cover"
              className="aspect-[16/7] w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <button
              type="button"
              onClick={() => setCoverUrl(null)}
              className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-all duration-200 hover:bg-background hover:scale-110 opacity-0 group-hover:opacity-100"
              aria-label="Remove cover image"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 text-muted-foreground transition-all duration-300 hover:border-primary/70 hover:bg-card hover:text-foreground active:scale-95"
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-6 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            )}
            <span className="text-sm font-medium">
              {uploading ? 'Uploading…' : 'Add a cover image'}
            </span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give this page a title…"
        className="w-full bg-transparent font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all duration-200 animate-slide-in"
        style={{ animationDelay: '150ms' }}
      />

      {/* Content */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Pour it out here — your music, your love, your sadness, your plans, your story…"
        className="mt-6 min-h-[320px] resize-none border-0 bg-transparent px-0 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/40 shadow-none focus-visible:ring-0 transition-all duration-200 animate-slide-in"
        style={{ animationDelay: '200ms' }}
      />

      {/* Mood */}
      <div className="mt-8 border-t border-border/50 pt-8 animate-slide-in" style={{ animationDelay: '250ms' }}>
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          How are you feeling?
        </Label>
        <div className="mt-4 flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const active = mood === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(active ? null : m.value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${active
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border/70 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-card/80'
                  }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Music */}
      <div className="mt-8 grid gap-2 animate-slide-in" style={{ animationDelay: '300ms' }}>
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          Add a song
        </Label>
        {musicUrl ? (
          musicUrl.includes('spotify.com') ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                  <svg className="size-4 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  <span className="text-xs font-medium text-muted-foreground">Selected Song</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMusicUrl('')
                    setSearchQuery('')
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                  title="Remove song"
                >
                  <X className="size-3.5" />
                  Remove
                </button>
              </div>
              <iframe
                src={`https://open.spotify.com/embed${musicUrl.split('spotify.com')[1]?.split('?')[0] || ''}`}
                title="Selected Song"
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="h-[80px] w-full border-none"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-400">
                  <Music className="size-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-[400px]">
                    {musicUrl}
                  </span>
                  <span className="text-xs text-muted-foreground">Pasted URL</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => {
                  setMusicUrl('')
                  setSearchQuery('')
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          )
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="music"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.startsWith('http')) {
                    setMusicUrl(e.target.value)
                  }
                }}
                placeholder="Search with Spotify..."
                className="pl-9 pr-10 transition-all duration-200 focus-visible:ring-emerald-500"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-1.5 w-full rounded-xl border border-emerald-500/20 bg-popover/95 backdrop-blur-xl p-2 shadow-2xl shadow-emerald-500/5 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Spotify branding header */}
                <div className="flex items-center gap-2 px-2.5 py-2 mb-1">
                  <svg className="size-4 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
                    Search Results
                  </span>
                </div>
                <div className="space-y-0.5">
                  {searchResults.map((track, i) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        setMusicUrl(track.url)
                        setSearchResults([])
                        setSearchQuery('')
                      }}
                      className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm hover:bg-emerald-500/10 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {track.albumArt ? (
                        <img
                          src={track.albumArt}
                          alt={track.album}
                          className="size-11 rounded-lg object-cover bg-muted shrink-0 shadow-sm ring-1 ring-border/20"
                        />
                      ) : (
                        <div className="size-11 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Music className="size-5 text-emerald-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate text-[13px]">{track.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artists} · {track.album}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sharing */}
      <div className="mt-10 space-y-4 animate-slide-in" style={{ animationDelay: '350ms' }}>
        {/* Public Share */}
        <div className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 transition-all duration-300 hover:border-border hover:bg-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-foreground">Share with anyone</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate a link anyone can view. Your notebook stays private.
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              aria-label="Make this entry public"
              className="transition-all duration-200"
            />
          </div>
          {isPublic && shareUrl && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2">
                <Input readOnly value={shareUrl} className="text-sm bg-background/50" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyShareLink}
                  aria-label="Copy share link"
                  className="transition-all duration-200 hover:scale-110"
                >
                  {copied ? (
                    <Check className="size-4 text-green-600" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
              {isEditing && entry && (
                <div className="flex gap-2">
                  <ShareEmailDialog entryId={entry.id} entryTitle={title || 'Untitled'} />
                </div>
              )}
            </div>
          )}
          {isPublic && !shareUrl && (
            <p className="mt-3 text-sm text-muted-foreground/70 italic">
              Save the entry to generate its shareable link.
            </p>
          )}
        </div>

        {/* Friend Share */}
        <div className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 transition-all duration-300 hover:border-border hover:bg-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-foreground">Share with friends</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your accepted friends see this in their Echoes feed.
              </p>
            </div>
            <Switch
              checked={sharedWithFriends}
              onCheckedChange={setSharedWithFriends}
              aria-label="Share with friends"
              className="transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
