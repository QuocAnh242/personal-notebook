'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
