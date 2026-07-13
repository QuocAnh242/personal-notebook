import { moodLabel } from '@/lib/moods'

export function MoodBadge({ mood }: { mood: string | null | undefined }) {
  const label = moodLabel(mood)
  if (!label) return null
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-accent px-2.5 py-0.5 text-xs font-medium tracking-wide text-accent-foreground">
      {label}
    </span>
  )
}
