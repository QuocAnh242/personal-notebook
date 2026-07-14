'use client'

import { useEffect, useState, startTransition } from 'react'
import { Bell, UserCheck, UserX } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { acceptFriendRequest, removeFriend } from '@/app/profile/actions'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'

type Friendship = {
  id: string
  status: string
  user1: {
    id: string
    username: string
  } | null
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    const now = ctx.currentTime
    osc.frequency.setValueAtTime(783.99, now) // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.08) // C6

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.start(now)
    osc.stop(now + 0.4)
  } catch (e) {
    console.warn('Audio chime blocked:', e)
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Friendship[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchNotifications = async (currentUserId: string) => {
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('id, status, user1_id')
      .eq('user2_id', currentUserId)
      .eq('status', 'pending')

    if (error || !friendships) return

    const user1Ids = Array.from(new Set(friendships.map((f) => f.user1_id)))
    let profiles: { id: string; username: string | null }[] = []
    if (user1Ids.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', user1Ids)
      profiles = profilesData || []
    }

    const mapped = friendships.map((f) => {
      const p = profiles.find((p) => p.id === f.user1_id)
      const user1Name = p?.username || `User_${f.user1_id.slice(0, 5)}`
      return {
        id: f.id,
        status: f.status,
        user1: { id: f.user1_id, username: user1Name }
      }
    })

    setNotifications(mapped)
  }

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        fetchNotifications(user.id)
      }
    }
    getSession()
  }, [])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('realtime-friendships-bell')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        (payload) => {
          if (
            payload.eventType === 'INSERT' &&
            payload.new &&
            payload.new.user2_id === userId &&
            payload.new.status === 'pending'
          ) {
            playChime()
          }
          fetchNotifications(userId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const handleAccept = async (id: string, senderName: string) => {
    const { error } = await acceptFriendRequest(id)
    if (error) {
      toast.error(error)
    } else {
      toast.success(`Accepted friend request from ${senderName}!`)
      if (userId) fetchNotifications(userId)
    }
  }

  const handleDecline = async (id: string, senderName: string) => {
    const { error } = await removeFriend(id)
    if (error) {
      toast.error(error)
    } else {
      toast.success(`Declined request from ${senderName}.`)
      if (userId) fetchNotifications(userId)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="size-[18px]" />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c63b3b] text-[10px] font-bold text-white animate-pulse">
            {notifications.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-semibold text-sm py-1.5 px-2">Notifications</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1" />
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No new notifications.
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1">
            {notifications.map((item) => {
              const senderName = item.user1?.username || 'Someone'
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors duration-150"
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-sm font-medium truncate">
                      {senderName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Sent you a friend request
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleAccept(item.id, senderName)}
                      className="size-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-md"
                      title="Accept"
                    >
                      <UserCheck className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDecline(item.id, senderName)}
                      className="size-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                      title="Decline"
                    >
                      <UserX className="size-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
