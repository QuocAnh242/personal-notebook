import Link from 'next/link'
import Image from 'next/image'
import { Plus, User } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { LogoutMenuItem } from '@/components/logout-button'

export function JournalHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/journal" className="flex items-center gap-3 text-primary">
          <Image src="/images/morrow-logo.png" alt="Morrow logo" width={40} height={40} />
          <span className="font-serif text-xl font-semibold tracking-tight text-[#c63b3b]">
            Morrow
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground">Explore</Link>
          <Link href="/journal/new" className={buttonVariants({ size: "sm", className: "flex items-center gap-1.5" })}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Start writing</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger 
              className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-full" })}
              aria-label="Account menu"
            >
              <User className="size-5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                  {email}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" render={<Link href="/profile" />}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <LogoutMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
