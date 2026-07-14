'use client'

import { useState, useTransition } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { addComment, deleteComment } from '@/app/journal/actions'

type Comment = {
  id: string
  content: string
  createdAt: string
  userId: string
  username: string
  avatarUrl: string | null
}

export function CommentsSection({
  entryId,
  initialComments,
  currentUserId,
}: {
  entryId: string
  initialComments: Comment[]
  currentUserId: string
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    startTransition(async () => {
      const { error } = await addComment(entryId, text)
      if (error) {
        toast.error(error)
      } else {
        // Optimistic: add comment to local state
        setComments(prev => [...prev, {
          id: crypto.randomUUID(),
          content: text.trim(),
          createdAt: new Date().toISOString(),
          userId: currentUserId,
          username: 'You',
          avatarUrl: null,
        }])
        setText('')
        toast.success('Comment posted!')
      }
    })
  }

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      const { error } = await deleteComment(commentId)
      if (error) {
        toast.error(error)
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId))
        toast.success('Comment removed.')
      }
    })
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="mt-10 border-t border-border/50 pt-8">
      <h3 className="font-serif text-lg font-semibold text-foreground mb-6">
        Thoughts & Echoes
        {comments.length > 0 && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({comments.length})
          </span>
        )}
      </h3>

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-4 mb-8">
          {comments.map((comment, i) => (
            <div
              key={comment.id}
              className="group flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Avatar */}
              <div className="shrink-0">
                {comment.avatarUrl ? (
                  <img
                    src={comment.avatarUrl}
                    alt={comment.username}
                    className="size-8 rounded-full object-cover ring-2 ring-border/30"
                  />
                ) : (
                  <div className="size-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-semibold text-primary ring-2 ring-border/30">
                    {comment.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Bubble */}
              <div className="flex-1 min-w-0">
                <div className="rounded-2xl rounded-tl-md bg-muted/50 border border-border/30 px-4 py-2.5 transition-colors duration-200 hover:bg-muted/70">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {comment.userId === currentUserId ? 'You' : comment.username}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>

                {/* Delete button for own comments */}
                {comment.userId === currentUserId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={isPending}
                    className="mt-1 ml-2 text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 duration-200"
                  >
                    <Trash2 className="size-3 inline mr-0.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/60 italic mb-6">
          No echoes yet. Be the first to share a thought.
        </p>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Leave an echo…"
          disabled={isPending}
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all duration-200 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="inline-flex items-center justify-center size-10 rounded-full bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  )
}
