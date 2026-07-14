'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="rounded-full" disabled />
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? (
        <Sun className="size-5 transition-all duration-500 rotate-0 hover:rotate-180" />
      ) : (
        <Moon className="size-5 transition-all duration-500" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
