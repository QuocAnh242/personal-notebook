'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

export function LogoutMenuItem() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={logout}>
      <LogOut className="mr-2 size-4" aria-hidden="true" />
      Sign out
    </DropdownMenuItem>
  )
}
