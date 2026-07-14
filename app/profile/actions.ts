'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseError } from '@/lib/error-handler'

export async function testAdminClient() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('profiles').select('id, username').limit(3)
  console.log('TEST ADMIN CLIENT:', data, error)
  return { data, error }
}

export type SearchUserResult = {
  id: string
  username: string | null
  avatar_url: string | null
  email: string | null
  relationship: 'none' | 'friend' | 'pending_sent' | 'pending_received'
}

async function syncProfileEmail(userId: string, email: string | undefined) {
  if (!email) return
  const supabase = await createClient()
  await supabase.from('profiles').upsert({ id: userId, email })
}

export async function updateProfile(username: string, avatarUrl?: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const updateData: {
    id: string
    username: string
    avatar_url?: string | null
    email?: string
  } = {
    id: user.id,
    username: username.trim(),
  }

  if (avatarUrl !== undefined) {
    updateData.avatar_url = avatarUrl
  }
  if (user.email) {
    updateData.email = user.email
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(updateData)

  if (error) return { error: parseError(error) }
  revalidatePath('/profile')
  return { error: null }
}

export async function searchUsers(query: string): Promise<{
  users: SearchUserResult[]
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { users: [], error: 'Not authenticated' }

  const q = query.trim()
  if (q.length < 2) return { users: [], error: null }

  const pattern = `%${q}%`
  const adminSupabase = createAdminClient()

  const { data: profiles, error: searchError } = await adminSupabase
    .from('profiles')
    .select('id, username, avatar_url, email')
    .or(`username.ilike.${pattern},email.ilike.${pattern}`)
    .neq('id', user.id)
    .limit(10)

  if (searchError) return { users: [], error: parseError(searchError) }
  if (!profiles?.length) return { users: [], error: null }

  const { data: friendships } = await supabase
    .from('friendships')
    .select('user1_id, user2_id, status')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

  const users: SearchUserResult[] = profiles.map((profile) => {
    const friendship = (friendships ?? []).find(
      (f) =>
        (f.user1_id === user.id && f.user2_id === profile.id) ||
        (f.user1_id === profile.id && f.user2_id === user.id),
    )

    let relationship: SearchUserResult['relationship'] = 'none'
    if (friendship?.status === 'accepted') relationship = 'friend'
    else if (friendship?.status === 'pending' && friendship.user1_id === user.id) {
      relationship = 'pending_sent'
    } else if (friendship?.status === 'pending' && friendship.user2_id === user.id) {
      relationship = 'pending_received'
    }

    return {
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      email: profile.email,
      relationship,
    }
  })

  return { users, error: null }
}

export async function sendFriendRequest(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (targetUserId === user.id) return { error: 'Cannot add yourself' }

  const adminSupabase = createAdminClient()

  const { data: targetProfile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('id', targetUserId)
    .single()

  if (profileError || !targetProfile) return { error: 'User not found' }

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
      status: 'pending',
    })

  if (error) {
    if (error.code === '23505') return { error: 'Friend request already exists' }
    return { error: parseError(error) }
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

  if (error) return { error: parseError(error) }
  revalidatePath('/profile')
  return { error: null }
}

export async function removeFriend(friendshipId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)

  if (error) return { error: parseError(error) }
  revalidatePath('/profile')
  return { error: null }
}
