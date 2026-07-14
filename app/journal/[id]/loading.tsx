import { Loader2 } from 'lucide-react'
import { JournalHeader } from '@/components/journal/journal-header'

export default function Loading() {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="size-8 text-muted-foreground animate-spin" />
      </main>
    </div>
  )
}
