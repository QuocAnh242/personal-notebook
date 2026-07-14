'use client'

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { ENCOURAGEMENTS } from '@/lib/encouragements'

interface Quote {
  quote: string
}

interface DailyCache {
  date: string
  quotes: Quote[]
}

const getTodayString = () => {
  return new Date().toLocaleDateString('en-CA')
}

export function EncouragementSkeleton() {
  return (
    <section className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-5 shadow-sm backdrop-blur-sm animate-pulse-gentle">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground/30">
        <Sparkles className="size-4" />
        <div className="h-3 w-24 rounded bg-muted" />
      </div>
      <div className="space-y-2 py-1">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
      </div>
    </section>
  )
}

export function Encouragement() {
  const [quote, setQuote] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadQuotes = async () => {
      const today = getTodayString()
      const cachedStr = localStorage.getItem('morrow_daily_quotes')
      let fetchedQuotes: Quote[] = []

      if (cachedStr) {
        try {
          const cached: DailyCache = JSON.parse(cachedStr)
          if (cached.date === today && cached.quotes && cached.quotes.length > 0) {
            fetchedQuotes = cached.quotes
          }
        } catch (e) {
          console.error('Error parsing cached quotes:', e)
        }
      }

      // If no valid cache for today, fetch fresh quotes from Gemini API
      if (fetchedQuotes.length === 0) {
        try {
          const res = await fetch('/api/daily-quotes')
          if (res.ok) {
            const data = await res.json()
            if (data.quotes && data.quotes.length > 0) {
              fetchedQuotes = data.quotes
            }
          }
        } catch (error) {
          console.error('Failed to fetch daily quotes, falling back:', error)
        }

        // If fetch failed or returned empty, generate fallback quotes locally
        if (fetchedQuotes.length === 0) {
          const localList = [...ENCOURAGEMENTS]
          // Shuffle local list
          for (let i = localList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [localList[i], localList[j]] = [localList[j], localList[i]]
          }
          fetchedQuotes = localList.slice(0, 10).map(q => ({ quote: q }))
        }

        // Save the 10 fetched quotes in localStorage for today
        try {
          const newCache: DailyCache = {
            date: today,
            quotes: fetchedQuotes,
          }
          localStorage.setItem('morrow_daily_quotes', JSON.stringify(newCache))
        } catch (e) {
          console.error('Error writing quotes cache:', e)
        }
      }

      // Choose a random quote from the 10 cached/fetched ones on every mount
      if (fetchedQuotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * fetchedQuotes.length)
        setQuote(fetchedQuotes[randomIndex]?.quote || ENCOURAGEMENTS[0])
      } else {
        setQuote(ENCOURAGEMENTS[0])
      }
      setLoading(false)
    }

    loadQuotes()
  }, [])

  if (loading) {
    return <EncouragementSkeleton />
  }

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
        {quote}
      </p>
    </section>
  )
}
