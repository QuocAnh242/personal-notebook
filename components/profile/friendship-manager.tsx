'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, UserMinus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sendFriendRequest, acceptFriendRequest, removeFriend } from '@/app/profile/actions'

type Friendship = {
  id: string
  status: string
  user1: { id: string, username: string }
  user2: { id: string, username: string }
}

export function FriendshipManager({
  currentUserId,
  accepted,
  pendingReceived,
  pendingSent
}: {
  currentUserId: string
  accepted: Friendship[]
  pendingReceived: Friendship[]
  pendingSent: Friendship[]
}) {
  const [targetUsername, setTargetUsername] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSendRequest = async () => {
    if (!targetUsername.trim()) return
    setIsSending(true)
    const { error } = await sendFriendRequest(targetUsername)
    setIsSending(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Friend request sent!')
      setTargetUsername('')
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

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">Add a Friend</h2>
        <p className="mt-1 text-sm text-muted-foreground mb-4">
          Connect with others by their pen name.
        </p>
        <div className="flex gap-2">
          <input 
            type="text"
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            placeholder="Friend's pen name"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button onClick={handleSendRequest} disabled={isSending || !targetUsername.trim()}>
            <UserPlus className="size-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {pendingReceived.length > 0 && (
        <div>
          <h3 className="font-medium text-sm text-foreground mb-3">Pending Requests</h3>
          <div className="flex flex-col gap-2">
            {pendingReceived.map(f => (
              <div key={f.id} className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-lg text-sm">
                <span>{f.user1?.username || 'Unknown'} wants to connect</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleAccept(f.id)}>
                    <Check className="size-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(f.id)}>
                    <UserMinus className="size-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-medium text-sm text-foreground mb-3">Your Friends ({accepted.length})</h3>
        {accepted.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">You haven't added anyone yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {accepted.map(f => {
              const friend = f.user1?.id === currentUserId ? f.user2 : f.user1
              return (
                <div key={f.id} className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded-lg text-sm">
                  <span>{friend?.username || 'Unknown'}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(f.id)}>
                    <UserMinus className="size-4 text-muted-foreground hover:text-red-500" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {pendingSent.length > 0 && (
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-2">Sent Requests</h3>
          <div className="flex flex-col gap-2">
            {pendingSent.map(f => (
              <div key={f.id} className="flex items-center justify-between px-3 py-1 text-xs text-muted-foreground">
                <span>To: {f.user2?.username || 'Unknown'}</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleRemove(f.id)}>
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
