export type Mood = {
  value: string
  label: string
  emoji?: never
}

// Moods drawn from what the user wants to capture: love, sadness, anger,
// pity, joy, hope, plans, lore/story. Kept as clean text labels (no emoji).
export const MOODS = [
  { value: 'love', label: 'Love' },
  { value: 'joy', label: 'Joy' },
  { value: 'hope', label: 'Hope' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'calm', label: 'Calm' },
  { value: 'nostalgia', label: 'Nostalgia' },
  { value: 'sadness', label: 'Sadness' },
  { value: 'anger', label: 'Anger' },
  { value: 'fear', label: 'Fear' },
  { value: 'pity', label: 'Pity' },
  { value: 'music', label: 'Music' },
  { value: 'plans', label: 'Plans' },
  { value: 'story', label: 'Story' },
] as const

export type MoodValue = (typeof MOODS)[number]['value']

export function moodLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return MOODS.find((m) => m.value === value)?.label ?? value
}
