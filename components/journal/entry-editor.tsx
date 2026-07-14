'use client'

import { useRef, useState, useTransition } from 'react'
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
} from 'lucide-react'
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
} from '@/app/journal/actions'

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
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('covers')
        .upload(path, file, { upsert: true })
      if (error) throw error
      const {
        data: { publicUrl },
      } = supabase.storage.from('covers').getPublicUrl(path)
      setCoverUrl(publicUrl)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not upload the image.',
      )
    } finally {
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
        <Button asChild variant="ghost" size="sm" className="transition-all duration-200 hover:translate-x-[-2px]">
          <Link href="/journal">
            <ArrowLeft className="size-4 transition-all duration-300" aria-hidden="true" />
            Back
          </Link>
        </Button>
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
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  active
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
        <Label htmlFor="music" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          Add a song (optional)
        </Label>
        <Input
          id="music"
          type="url"
          inputMode="url"
          value={musicUrl}
          onChange={(e) => setMusicUrl(e.target.value)}
          placeholder="Paste a Spotify or YouTube link"
          className="transition-all duration-200"
        />
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
            <div className="mt-4 flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
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
