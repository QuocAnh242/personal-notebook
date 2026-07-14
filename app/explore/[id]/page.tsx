import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MoodBadge } from '@/components/journal/mood-badge'
import { MusicEmbed } from '@/components/journal/music-embed'
import { CommentsSection } from '@/components/journal/comments-section'
import { formatDate } from '@/lib/format'
import { fetchComments } from '@/app/journal/actions'

export default async function ExploreEntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch the entry
  const { data: entry } = await supabase
    .from('entries')
    .select('id, title, content, mood, cover_url, music_url, is_public, shared_with_friends, user_id, created_at')
    .eq('id', id)
    .single()

  if (!entry) notFound()

  // Check access: either own entry, or shared_with_friends + is a friend
  const isOwner = entry.user_id === user.id

  if (!isOwner) {
    if (!entry.shared_with_friends && !entry.is_public) notFound()

    // If shared_with_friends, verify they are friends
    if (entry.shared_with_friends && !entry.is_public) {
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .eq('status', 'accepted')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${entry.user_id}),and(user1_id.eq.${entry.user_id},user2_id.eq.${user.id})`)
        .limit(1)
        .single()

      if (!friendship) notFound()
    }
  }

  // Fetch author profile
  const { data: author } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', entry.user_id)
    .single()

  // Fetch comments
  const comments = await fetchComments(entry.id)

  return (
    <div className="min-h-svh bg-background">
      <main className="mx-auto w-full max-w-2xl px-4 py-8 animate-in fade-in duration-500">
        {/* Back navigation */}
        <Link
          href="/explore"
          className="group mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back to Echoes
        </Link>

        {/* Cover image */}
        {entry.cover_url && (
          <div className="mt-4 overflow-hidden rounded-xl border border-border shadow-sm animate-slide-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.cover_url}
              alt=""
              className="aspect-[16/7] w-full object-cover"
            />
          </div>
        )}

        {/* Author info */}
        <div className="mt-6 flex items-center gap-3 animate-slide-in" style={{ animationDelay: '50ms' }}>
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.username || ''}
              className="size-10 rounded-full object-cover ring-2 ring-border/30"
            />
          ) : (
            <div className="size-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-semibold text-primary ring-2 ring-border/30">
              {(author?.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {author?.username || `User_${entry.user_id.slice(0, 5)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(entry.created_at)}
            </p>
          </div>
        </div>

        {/* Title */}
        <h1
          className="mt-6 text-balance font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground animate-slide-in"
          style={{ animationDelay: '100ms' }}
        >
          {entry.title || 'Untitled'}
        </h1>

        {/* Mood badge */}
        {entry.mood && (
          <div className="mt-4 animate-slide-in" style={{ animationDelay: '150ms' }}>
            <MoodBadge mood={entry.mood} />
          </div>
        )}

        {/* Content */}
        <div
          className="mt-8 whitespace-pre-wrap text-pretty text-base leading-relaxed text-foreground animate-slide-in"
          style={{ animationDelay: '200ms' }}
        >
          {entry.content}
        </div>

        {/* Music embed */}
        {entry.music_url && (
          <div className="mt-8 animate-slide-in" style={{ animationDelay: '250ms' }}>
            <MusicEmbed url={entry.music_url} />
          </div>
        )}

        {/* Comments */}
        <CommentsSection
          entryId={entry.id}
          initialComments={comments}
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
