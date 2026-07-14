'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { UserPlus, UserMinus, Check, Search, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  searchUsers,
  type SearchUserResult,
} from '@/app/profile/actions'
import { UserAvatar } from '@/components/profile/user-avatar'

type ProfileSummary = {
  id: string
  username: string
  avatar_url?: string | null
  email?: string | null
}

type Friendship = {
  id: string
  status: string
  user1: ProfileSummary
  user2: ProfileSummary
}

function ProfileRow({
  username,
  avatarUrl,
  subtitle,
  action,
}: {
  username: string
  avatarUrl?: string | null
  subtitle?: ReactNode
  action: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
      <UserAvatar username={username} avatarUrl={avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{username}</p>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

function relationshipLabel(relationship: SearchUserResult['relationship']) {
  switch (relationship) {
    case 'friend':
      return 'Friends'
    case 'pending_sent':
      return 'Request sent'
    case 'pending_received':
      return 'Wants to connect'
    default:
      return null
  }
}

export function FriendshipManager({
  currentUserId,
  accepted,
  pendingReceived,
  pendingSent,
}: {
  currentUserId: string
  accepted: Friendship[]
  pendingReceived: Friendship[]
  pendingSent: Friendship[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  const runSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    const { users, error } = await searchUsers(query)
    setIsSearching(false)
    if (error) {
      toast.error(error)
      return
    }
    setSearchResults(users)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, runSearch])

  const handleSendRequest = async (targetUserId: string) => {
    setSendingTo(targetUserId)
    const { error } = await sendFriendRequest(targetUserId)
    setSendingTo(null)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Friend request sent!')
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === targetUserId ? { ...u, relationship: 'pending_sent' } : u,
        ),
      )
    }
  }

  const handleAccept = async (id: string) => {
    const { error } = await acceptFriendRequest(id)
    if (error) toast.error(error)
    else toast.success('Friend request accepted!')
  }

  const handleRemove = async (id: string) => {
    const { error } = await removeFriend(id)
    if (error) toast.error(error)
    else toast.success('Friend removed.')
  }

  const displayName = (profile: ProfileSummary) =>
    profile.username || `User_${profile.id.slice(0, 5)}`

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">Find Friends</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Search by email or pen name to connect with someone.
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email or pen name…"
            className="h-10 pl-9"
          />
        </div>

        {searchQuery.trim().length >= 2 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-border/60">
            {isSearching ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Searching…
              </div>
            ) : searchResults.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No users found for &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {searchResults.map((user) => {
                  const name = user.username || `User_${user.id.slice(0, 5)}`
                  const status = relationshipLabel(user.relationship)

                  return (
                    <li
                      key={user.id}
                      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/20"
                    >
                      <UserAvatar
                        username={user.username}
                        avatarUrl={user.avatar_url}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{name}</p>
                        {user.email && (
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                      {status ? (
                        <span className="shrink-0 text-xs text-muted-foreground">{status}</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={sendingTo === user.id}
                          onClick={() => handleSendRequest(user.id)}
                        >
                          {sendingTo === user.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="mr-1.5 size-3.5" />
                              Add
                            </>
                          )}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {pendingReceived.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-foreground">Pending Requests</h3>
          <div className="flex flex-col gap-2">
            {pendingReceived.map((f) => (
              <ProfileRow
                key={f.id}
                username={displayName(f.user1)}
                avatarUrl={f.user1.avatar_url}
                subtitle="Wants to connect"
                action={
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleAccept(f.id)}>
                      <Check className="size-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(f.id)}>
                      <UserMinus className="size-4 text-red-500" />
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">
          Your Friends ({accepted.length})
        </h3>
        {accepted.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            You haven&apos;t added anyone yet. Search above to find someone.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {accepted.map((f) => {
              const friend = f.user1?.id === currentUserId ? f.user2 : f.user1
              return (
                <ProfileRow
                  key={f.id}
                  username={displayName(friend)}
                  avatarUrl={friend.avatar_url}
                  subtitle={friend.email ?? undefined}
                  action={
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(f.id)}>
                      <UserMinus className="size-4 text-muted-foreground hover:text-red-500" />
                    </Button>
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      {pendingSent.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Sent Requests</h3>
          <div className="flex flex-col gap-2">
            {pendingSent.map((f) => (
              <ProfileRow
                key={f.id}
                username={displayName(f.user2)}
                avatarUrl={f.user2.avatar_url}
                subtitle={
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    Awaiting response
                  </span>
                }
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleRemove(f.id)}
                  >
                    Cancel
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
