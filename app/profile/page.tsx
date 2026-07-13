import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JournalHeader } from '@/components/journal/journal-header'
import { ProfileManager } from '@/components/profile/profile-manager'
import { FriendshipManager } from '@/components/profile/friendship-manager'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  // Fetch friendships (both sent and received)
  const { data: friendshipsData } = await supabase
    .from('friendships')
    .select(`
      id,
      status,
      user1:profiles!friendships_user1_id_fkey(id, username),
      user2:profiles!friendships_user2_id_fkey(id, username)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

  const friendships = friendshipsData || []

  // Split friendships into categories
  const acceptedFriends = friendships.filter(f => f.status === 'accepted')
  const pendingReceived = friendships.filter(f => f.status === 'pending' && f.user2?.id === user.id)
  const pendingSent = friendships.filter(f => f.status === 'pending' && f.user1?.id === user.id)

  return (
    <div className="min-h-svh bg-background">
      <JournalHeader email={user.email ?? ''} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight text-foreground">
            Your Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your pen name and your circle of friends.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <ProfileManager 
            initialUsername={profile?.username || ''} 
          />
          <FriendshipManager 
            currentUserId={user.id}
            accepted={acceptedFriends}
            pendingReceived={pendingReceived}
            pendingSent={pendingSent}
          />
        </div>
      </main>
    </div>
  )
}
