import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JournalHeader } from '@/components/journal/journal-header'
import { EntryCard, type EntryListItem } from '@/components/journal/entry-card'
import { InfiniteEntryList } from '@/components/journal/infinite-entry-list'
import { getMoreExploreEntries, augmentEntriesWithSpotify } from '../journal/fetch-actions'

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // 1. Fetch accepted friendships
  const { data: friendshipsData } = await supabase
    .from('friendships')
    .select('user1_id, user2_id')
    .eq('status', 'accepted')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

  const friendIds = (friendshipsData || []).map(f =>
    f.user1_id === user.id ? f.user2_id : f.user1_id
  )

  // 2. Fetch shared entries from friends
  let list: EntryListItem[] = []

  if (friendIds.length > 0) {
    const { data: entries } = await supabase
      .from('entries')
      .select('id, title, content, mood, cover_url, music_url, is_public, created_at')
      .in('user_id', friendIds)
      .eq('shared_with_friends', true)
      .order('created_at', { ascending: false })
      .limit(20)

    list = await augmentEntriesWithSpotify(entries ?? [])
  }

  return (
    <div className="min-h-svh bg-background">
      <JournalHeader email={user.email ?? ''} currentTab="explore" />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight text-foreground">
            The Echoes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A quiet space to read the shared thoughts of your friends.
          </p>
        </div>

        {friendIds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              It's quiet here
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              Add some friends in your Profile to start reading their shared entries here.
            </p>
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              No recent whispers
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              None of your friends have shared any entries yet.
            </p>
          </div>
        ) : (
          <InfiniteEntryList
            initialEntries={list}
            fetchAction={getMoreExploreEntries}
            limit={3}
            baseHref="/explore"
          />
        )}
      </main>
    </div>
  )
}
