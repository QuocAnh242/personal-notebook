'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, username: username.trim() })

  if (error) return { error: error.message }
  revalidatePath('/profile')
  return { error: null }
}

export async function sendFriendRequest(targetUsername: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Find target user by username
  const { data: targetProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', targetUsername.trim())
    .single()

  if (profileError || !targetProfile) return { error: 'User not found' }
  if (targetProfile.id === user.id) return { error: 'Cannot add yourself' }

  // Check if friendship exists in reverse direction
  const { data: existingReverse } = await supabase
    .from('friendships')
    .select('id')
    .eq('user1_id', targetProfile.id)
    .eq('user2_id', user.id)
    .single()
    
  if (existingReverse) return { error: 'Friend request already exists from this user' }

  const { error } = await supabase
    .from('friendships')
    .insert({
      user1_id: user.id,
      user2_id: targetProfile.id,
      status: 'pending'
    })

  if (error) {
    if (error.code === '23505') return { error: 'Friend request already exists' }
    return { error: error.message }
  }
  
  revalidatePath('/profile')
  return { error: null }
}

export async function acceptFriendRequest(friendshipId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)

  if (error) return { error: error.message }
  revalidatePath('/profile')
  return { error: null }
}

export async function removeFriend(friendshipId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)

  if (error) return { error: error.message }
  revalidatePath('/profile')
  return { error: null }
}
