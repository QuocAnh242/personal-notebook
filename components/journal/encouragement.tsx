import { Sparkles } from 'lucide-react'
import { encouragementOfTheDay } from '@/lib/encouragements'

export function Encouragement() {
  const message = encouragementOfTheDay()
  return (
    <section
      aria-label="Encouragement for today"
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="mb-2 flex items-center gap-2 text-primary">
        <Sparkles className="size-4" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-widest">
          For you today
        </span>
      </div>
      <p className="text-balance font-serif text-xl leading-snug text-foreground">
        {message}
      </p>
    </section>
  )
}
