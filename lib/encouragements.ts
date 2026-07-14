export const ENCOURAGEMENTS = [
  'You are becoming, quietly and surely, someone you will be proud of.',
  'Your feelings are worth writing down. All of them.',
  'The person you are today is enough. The person you are growing into is on the way.',
  'Softness is not weakness. Keep your tender heart.',
  'Even your sadness is proof that you loved something deeply.',
  'You are allowed to begin again, as many times as you need.',
  'Small pages become a whole story. Keep turning them.',
  'What you carry is heavy, and you are strong for carrying it.',
  'You are worthy of the love you so freely give to others.',
  'Rest is also progress. Be gentle with yourself today.',
  'Your anger is information. Listen to it, then let it teach you.',
  'One honest sentence today is a victory. Write it.',
]

// Deterministic per-day pick so the message feels intentional, not random.
export function encouragementOfTheDay(date = new Date()): string {
  const dayIndex = Math.floor(date.getTime() / 86_400_000)
  return ENCOURAGEMENTS[dayIndex % ENCOURAGEMENTS.length]
}
