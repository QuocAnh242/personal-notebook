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

  // Fetch friendships (both sent and received) and profiles independently
  const { data: friendshipsRaw } = await supabase
    .from('friendships')
    .select('id, status, user1_id, user2_id')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

  const friendshipsData = friendshipsRaw || []

  // Fetch all profiles involved in these friendships
  const profileIds = Array.from(
    new Set(friendshipsData.flatMap((f) => [f.user1_id, f.user2_id]))
  )

  let profiles: {
    id: string
    username: string | null
    avatar_url: string | null
    email: string | null
  }[] = []
  if (profileIds.length > 0) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminSupabase = createAdminClient()
    const { data: profilesData } = await adminSupabase
      .from('profiles')
      .select('id, username, avatar_url, email')
      .in('id', profileIds)
    profiles = profilesData || []
  }


  // Stitch them together in JS
  const friendships = friendshipsData.map((f) => {
    const p1 = profiles.find((p) => p.id === f.user1_id)
    const p2 = profiles.find((p) => p.id === f.user2_id)

    const user1Name = p1?.username || `User_${f.user1_id.slice(0, 5)}`
    const user2Name = p2?.username || `User_${f.user2_id.slice(0, 5)}`

    return {
      id: f.id,
      status: f.status,
      user1: {
        id: f.user1_id,
        username: user1Name,
        avatar_url: p1?.avatar_url ?? null,
        email: p1?.email ?? null,
      },
      user2: {
        id: f.user2_id,
        username: user2Name,
        avatar_url: p2?.avatar_url ?? null,
        email: p2?.email ?? null,
      },
    }
  })

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
            initialAvatarUrl={profile?.avatar_url || null}
            userId={user.id}
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
