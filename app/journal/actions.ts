'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { checkImageSafe } from '@/lib/vision'


export type EntryInput = {
  title: string
  content: string
  mood: string | null
  coverUrl: string | null
  musicUrl: string | null
  isPublic: boolean
  sharedWithFriends: boolean
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return { supabase, user }
}

export async function createEntry(input: EntryInput) {
  const { supabase, user } = await requireUser()

  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      content: input.content,
      mood: input.mood,
      cover_url: input.coverUrl,
      music_url: input.musicUrl?.trim() || null,
      is_public: input.isPublic,
      shared_with_friends: input.sharedWithFriends,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/journal')
  redirect(`/journal/${data.id}`)
}

export async function updateEntry(id: string, input: EntryInput) {
  const { supabase } = await requireUser()

  const { error } = await supabase
    .from('entries')
    .update({
      title: input.title.trim(),
      content: input.content,
      mood: input.mood,
      cover_url: input.coverUrl,
      music_url: input.musicUrl?.trim() || null,
      is_public: input.isPublic,
      shared_with_friends: input.sharedWithFriends,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/journal')
  revalidatePath(`/journal/${id}`)
  return { error: null }
}

export async function deleteEntry(id: string) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from('entries').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/journal')
  redirect('/journal')
}

export async function setEntryVisibility(id: string, isPublic: boolean) {
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from('entries')
    .update({ is_public: isPublic })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/journal')
  revalidatePath(`/journal/${id}`)
  return { error: null }
}

export async function shareEntryViaEmail(
  entryId: string,
  recipientEmail: string,
  message?: string
) {
  const { supabase } = await requireUser()

  // Verify entry exists and belongs to user
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('id, user_id, share_slug')
    .eq('id', entryId)
    .single()

  if (entryError || !entry) {
    return { error: 'Entry not found' }
  }

  if (entry.user_id) {
    const { user } = await requireUser()
    if (entry.user_id !== user.id) {
      return { error: 'Unauthorized' }
    }
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entryId,
        recipientEmail,
        message,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Failed to send email' }
    }

    return { error: null, success: true }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to send email',
    }
  }
}

export async function uploadCoverAndModerate(base64Image: string, fileName: string) {
  const { supabase, user } = await requireUser()

  // 1. Moderate the image via Google Cloud Vision API
  const moderation = await checkImageSafe(base64Image)
  if (!moderation.safe) {
    return { error: moderation.reason || 'Image violates content policy' }
  }

  try {
    // 2. Convert base64 back to buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const ext = fileName.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    // 3. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(path, buffer, {
        contentType: `image/${ext}`,
        upsert: true
      })

    if (uploadError) throw uploadError

    // 4. Return the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('covers').getPublicUrl(path)

    return { error: null, publicUrl }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Could not upload image.',
    }
  }
}

let cachedToken: string | null = null
let tokenExpiry = 0

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('Spotify Client ID or Client Secret is not set.')
    return null
  }

  const now = Date.now()
  if (cachedToken && now < tokenExpiry) {
    return cachedToken
  }

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store'
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch Spotify token: ${res.statusText}`)
    }

    const data = await res.json()
    cachedToken = data.access_token
    tokenExpiry = now + data.expires_in * 1000 - 60000 // expire 1 min early
    return cachedToken
  } catch (error) {
    console.error('Error fetching Spotify token:', error)
    return null
  }
}

export async function searchSpotifyTracks(query: string) {
  if (!query.trim()) return []

  const token = await getSpotifyToken()
  if (!token) return []

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!res.ok) {
      throw new Error(`Spotify search failed: ${res.statusText}`)
    }

    const data = await res.json()
    const tracks = data.tracks?.items || []

    return tracks.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images?.[2]?.url || track.album.images?.[0]?.url || '',
      url: `https://open.spotify.com/track/${track.id}`
    }))
  } catch (error) {
    console.error('Error searching Spotify tracks:', error)
    return []
  }
}

export async function getSpotifyTrackDetails(urlOrId: string) {
  if (!urlOrId) return null

  let trackId = urlOrId
  if (urlOrId.includes('spotify.com')) {
    const parts = urlOrId.split('/track/')
    if (parts[1]) {
      trackId = parts[1].split('?')[0]
    } else {
      return null
    }
  }

  const token = await getSpotifyToken()
  if (!token) return null

  try {
    const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 86400 } // cache track details for 24h
    })

    if (!res.ok) {
      throw new Error(`Spotify fetch track failed: ${res.statusText}`)
    }

    const track = await res.json()
    return {
      id: track.id,
      name: track.name,
      artists: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images?.[1]?.url || track.album.images?.[0]?.url || '',
      previewUrl: track.preview_url || null,
      url: `https://open.spotify.com/track/${track.id}`
    }
  } catch (error) {
    console.error('Error fetching Spotify track details:', error)
    return null
  }
}

export async function fetchComments(entryId: string) {
  const supabase = await createClient()
  
  const { data: comments, error } = await supabase
    .from('comments')
    .select('id, content, user_id, created_at')
    .eq('entry_id', entryId)
    .order('created_at', { ascending: true })

  if (error || !comments) return []

  // Fetch profile info for commenters
  const userIds = Array.from(new Set(comments.map(c => c.user_id)))
  let profiles: { id: string; username: string | null; avatar_url: string | null }[] = []
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds)
    profiles = profilesData || []
  }

  return comments.map(c => {
    const p = profiles.find(p => p.id === c.user_id)
    return {
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      userId: c.user_id,
      username: p?.username || `User_${c.user_id.slice(0, 5)}`,
      avatarUrl: p?.avatar_url || null,
    }
  })
}

export async function addComment(entryId: string, content: string) {
  const { supabase, user } = await requireUser()

  if (!content.trim()) return { error: 'Comment cannot be empty' }

  // Fetch the entry's author id to send the notification
  const { data: entry } = await supabase
    .from('entries')
    .select('user_id')
    .eq('id', entryId)
    .single()

  const { error } = await supabase
    .from('comments')
    .insert({
      entry_id: entryId,
      user_id: user.id,
      content: content.trim(),
    })

  if (error) return { error: error.message }

  // Insert a notification if the commenter is not the entry author
  if (entry && entry.user_id !== user.id) {
    const { error: notifErr } = await supabase
      .from('notifications')
      .insert({
        user_id: entry.user_id,
        sender_id: user.id,
        type: 'comment',
        entry_id: entryId,
        read: false
      })
    
    if (notifErr) {
      console.error('FAILED TO INSERT NOTIFICATION:', notifErr)
    } else {
      console.log('SUCCESSFULLY INSERTED NOTIFICATION')
    }
  }

  revalidatePath(`/explore/${entryId}`)
  return { error: null }
}

export async function deleteComment(commentId: string) {
  const { supabase } = await requireUser()

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) return { error: error.message }
  return { error: null }
}

