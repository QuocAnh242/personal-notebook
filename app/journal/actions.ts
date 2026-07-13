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
