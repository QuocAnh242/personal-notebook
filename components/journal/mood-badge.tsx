import { moodLabel } from '@/lib/moods'

export function MoodBadge({ mood }: { mood: string | null | undefined }) {
  const label = moodLabel(mood)
  if (!label) return null
  return (
    <span className="inline-flex items-center rounded-full border border-border/70 bg-accent/80 px-3 py-1 text-xs font-medium tracking-wide text-accent-foreground transition-all duration-300 hover:bg-accent hover:scale-105 hover:shadow-md">
      {label}
    </span>
  )
}
