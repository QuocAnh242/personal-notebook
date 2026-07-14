'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { updateProfile } from '@/app/profile/actions'
import { Button } from '@/components/ui/button'

export function ProfileManager({ initialUsername }: { initialUsername: string }) {
  const [username, setUsername] = useState(initialUsername)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!username.trim()) return toast.error('Username cannot be empty')

    setIsSaving(true)
    const { error } = await updateProfile(username)
    setIsSaving(false)

    if (error) {
      toast.error(error)
    } else {
      toast.success('Profile updated successfully')
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-serif text-xl font-semibold text-foreground">Your Pen Name</h2>
      <p className="mt-2 text-sm text-muted-foreground mb-4">
        This name your friends will see when reading your echoes.
      </p>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. whispered_wind"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button onClick={handleSave} disabled={isSaving || username === initialUsername}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
