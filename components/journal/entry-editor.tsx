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
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/journal">
            <ArrowLeft className="size-4" aria-hidden="true" />
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
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          <Button onClick={handleSave} size="sm" disabled={isPending}>
            {isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {isEditing ? 'Save' : 'Publish to notebook'}
          </Button>
        </div>
      </div>

      {/* Cover */}
      <div className="mb-5">
        {coverUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl || '/placeholder.svg'}
              alt="Entry cover"
              className="aspect-[16/7] w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setCoverUrl(null)}
              className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-background"
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
            className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-6" aria-hidden="true" />
            )}
            <span className="text-sm">
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
        className="w-full bg-transparent font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
      />

      {/* Content */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Pour it out here — your music, your love, your sadness, your plans, your story…"
        className="mt-4 min-h-[280px] resize-none border-0 bg-transparent px-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
      />

      {/* Mood */}
      <div className="mt-6 border-t border-border pt-6">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Mood
        </Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const active = mood === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(active ? null : m.value)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Music */}
      <div className="mt-6 grid gap-2">
        <Label htmlFor="music" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Song link (optional)
        </Label>
        <Input
          id="music"
          type="url"
          inputMode="url"
          value={musicUrl}
          onChange={(e) => setMusicUrl(e.target.value)}
          placeholder="Paste a Spotify or YouTube link"
        />
      </div>

      {/* Sharing */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-foreground">Share this entry</p>
            <p className="text-sm text-muted-foreground">
              Anyone with the link can read it. Your notebook stays private.
            </p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={setIsPublic}
            aria-label="Make this entry public"
          />
        </div>
        {isPublic && shareUrl && (
          <div className="mt-3 flex items-center gap-2">
            <Input readOnly value={shareUrl} className="text-sm" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyShareLink}
              aria-label="Copy share link"
            >
              {copied ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        )}
        {isPublic && !shareUrl && (
          <p className="mt-3 text-sm text-muted-foreground">
            Save the entry to get its shareable link.
          </p>
        )}
      </div>
    </div>
  )
}
