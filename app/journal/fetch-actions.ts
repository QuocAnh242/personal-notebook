'use server'

import { createClient } from '@/lib/supabase/server'
import { type EntryListItem } from '@/components/journal/entry-card'
import { getSpotifyTrackDetails } from './actions'

export async function augmentEntriesWithSpotify(entries: any[]): Promise<EntryListItem[]> {
  return Promise.all(
    entries.map(async (entry) => {
      let spotifyTrack = null
      if (entry.music_url && entry.music_url.includes('spotify.com')) {
        try {
          spotifyTrack = await getSpotifyTrackDetails(entry.music_url)
        } catch (e) {
          console.error('Failed to fetch spotify details', e)
        }
      }
      return { ...entry, spotifyTrack }
    })
  )
}

export async function getMoreJournalEntries(offset: number, limit: number): Promise<EntryListItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from('entries')
    .select('id, title, content, mood, cover_url, music_url, is_public, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return augmentEntriesWithSpotify(data || [])
}

export async function getMoreExploreEntries(offset: number, limit: number): Promise<EntryListItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // 1. Fetch accepted friendships
  const { data: friendshipsData } = await supabase
    .from('friendships')
    .select('user1_id, user2_id')
    .eq('status', 'accepted')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

  const friendIds = (friendshipsData || []).map(f => 
    f.user1_id === user.id ? f.user2_id : f.user1_id
  )

  if (friendIds.length === 0) return []

  // 2. Fetch shared entries from friends
  const { data: entries } = await supabase
    .from('entries')
    .select('id, title, content, mood, cover_url, music_url, is_public, created_at')
    .in('user_id', friendIds)
    .eq('shared_with_friends', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return augmentEntriesWithSpotify(entries || [])
}
