'use client'

import { useState, useTransition } from 'react'
import { Mail, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { shareEntryViaEmail } from '@/app/journal/actions'

interface ShareEmailDialogProps {
  entryId: string
  entryTitle: string
}

export function ShareEmailDialog({ entryId, entryTitle }: ShareEmailDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    startTransition(async () => {
      const result = await shareEntryViaEmail(entryId, email, message)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Note shared! Your friend will receive it soon.')
        setEmail('')
        setMessage('')
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 transition-all duration-200 hover:scale-105"
        >
          <Mail className="size-4" />
          Share via email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] animate-scale-in">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Share "{entryTitle}"</DialogTitle>
          <DialogDescription>
            Send this note to anyone via email. They don&apos;t need an account to read it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Recipient email</Label>
            <Input
              id="email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              className="transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Personal message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to include with the link..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isPending}
              className="min-h-[100px] resize-none transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground">
              Your email address will be visible to the recipient
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleShare}
              disabled={isPending}
              className="gap-2 transition-all duration-200"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
