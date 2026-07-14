'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { updateProfile } from '@/app/profile/actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ImageCropperDialog } from '@/components/ui/image-cropper'

export function ProfileManager({
  initialUsername,
  initialAvatarUrl,
  userId,
}: {
  initialUsername: string
  initialAvatarUrl: string | null
  userId: string
}) {
  const [username, setUsername] = useState(initialUsername)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [cropperSrc, setCropperSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB.')
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setCropperSrc(objectUrl)
    setCropperOpen(true)
  }

  const handleAvatarUpload = async (file: File) => {
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const filePath = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Add cache-bust to force image refresh
      const url = `${publicUrl}?t=${Date.now()}`
      setAvatarUrl(url)
      toast.success('Avatar uploaded!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload avatar.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!username.trim()) return toast.error('Username cannot be empty')

    setIsSaving(true)
    const { error } = await updateProfile(username, avatarUrl)
    setIsSaving(false)

    if (error) {
      toast.error(error)
    } else {
      toast.success('Profile updated successfully')
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-serif text-xl font-semibold text-foreground">Your Profile</h2>
      <p className="mt-2 text-sm text-muted-foreground mb-6">
        Set your pen name and avatar for others to recognize you.
      </p>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="group relative size-24 rounded-full overflow-hidden ring-4 ring-border/30 hover:ring-primary/30 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="size-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-serif font-semibold text-primary">
              {username ? username.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {uploading ? (
              <Loader2 className="size-5 text-white animate-spin" />
            ) : (
              <Camera className="size-5 text-white" />
            )}
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleAvatarSelect(file)
            e.target.value = ''
          }}
        />
        <ImageCropperDialog
          isOpen={cropperOpen}
          onOpenChange={(open) => {
            setCropperOpen(open)
            if (!open && cropperSrc) URL.revokeObjectURL(cropperSrc)
          }}
          imageSrc={cropperSrc}
          aspect={1}
          onCropCompleteAction={handleAvatarUpload}
          title="Crop Avatar"
          description="Drag to adjust, pinch to zoom. Make it perfectly round!"
        />
      </div>

      {/* Username */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          Pen Name
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. whispered_wind"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button
          onClick={handleSave}
          disabled={isSaving || (username === initialUsername && avatarUrl === initialAvatarUrl)}
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
