import { Sparkles } from 'lucide-react'
import { encouragementOfTheDay } from '@/lib/encouragements'

export function Encouragement() {
  const message = encouragementOfTheDay()
  return (
    <section
      aria-label="Encouragement for today"
      className="group rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 backdrop-blur-sm animate-slide-in"
    >
      <div className="mb-3 flex items-center gap-2 text-primary/70 group-hover:text-primary transition-all duration-300">
        <Sparkles className="size-4 animate-pulse-gentle group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-widest letter-spacing">
          For you today
        </span>
      </div>
      <p className="text-balance font-serif text-lg leading-snug text-foreground group-hover:text-foreground/95 transition-all duration-300">
        {message}
      </p>
    </section>
  )
}
