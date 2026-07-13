import Link from 'next/link'
import { BookHeart, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogoutMenuItem } from '@/components/logout-button'

export function JournalHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/journal" className="flex items-center gap-2 text-primary">
          <BookHeart className="size-5" aria-hidden="true" />
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Leaflet
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/journal/new">
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">New entry</span>
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Account menu"
              >
                <User className="size-5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                {email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <LogoutMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
