'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, User, Sun, Moon, LogOut, Settings } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/journal/notification-bell'
import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'

export function JournalHeader({ email }: { email: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close menu on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handleKey)
    }
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const handleLogout = async () => {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/journal" className="flex items-center gap-3 text-primary">
          <Image src="/images/morrow-logo.png" alt="Morrow logo" width={40} height={40} />
          <span className="font-serif text-xl font-semibold tracking-tight text-[#c63b3b]">
            Morrow
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">Explore</Link>
          <Link href="/journal/new" className={buttonVariants({ size: "sm", className: "flex items-center gap-1.5" })}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Start writing</span>
          </Link>
          
          <NotificationBell />

          {/* Profile dropdown — custom implementation for reliability */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
              aria-label="Account menu"
              aria-expanded={open}
            >
              <User className="size-[18px]" />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-60 origin-top-right rounded-xl border border-border bg-popover p-1.5 shadow-xl ring-1 ring-foreground/5 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200">
                {/* Email header */}
                <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Account
                  </p>
                  <p className="text-sm text-foreground truncate mt-0.5 font-medium">
                    {email}
                  </p>
                </div>

                {/* Profile */}
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors duration-150"
                >
                  <Settings className="size-4 text-muted-foreground" />
                  Profile & Friends
                </Link>

                {/* Theme toggle */}
                {mounted && (
                  <button
                    onClick={() => {
                      setTheme(theme === 'dark' ? 'light' : 'dark')
                      setOpen(false)
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors duration-150"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === 'dark' ? (
                        <Moon className="size-4 text-muted-foreground" />
                      ) : (
                        <Sun className="size-4 text-muted-foreground" />
                      )}
                      <span>Theme</span>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </button>
                )}

                <div className="my-1 h-px bg-border/50" />

                {/* Sign out */}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-150"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
