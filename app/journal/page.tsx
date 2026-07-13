import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PenLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { JournalHeader } from '@/components/journal/journal-header'
import { Encouragement } from '@/components/journal/encouragement'
import { EntryCard, type EntryListItem } from '@/components/journal/entry-card'
import { Button } from '@/components/ui/button'

export default async function JournalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: entries } = await supabase
    .from('entries')
    .select('id, title, content, mood, cover_url, music_url, is_public, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const list = (entries ?? []) as EntryListItem[]

  return (
    <div className="min-h-svh bg-background">
      <JournalHeader email={user.email ?? ''} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight text-foreground">
            Your notebook
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A timeline of everything you&apos;ve felt, planned, and become.
          </p>
        </div>

        <div className="mb-8">
          <Encouragement />
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <PenLine
              className="mx-auto mb-4 size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Your first page awaits
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              Write about your day, a song stuck in your head, someone you love,
              or a plan for who you want to become.
            </p>
            <Button asChild className="mt-5">
              <Link href="/journal/new">Write your first entry</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {list.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
