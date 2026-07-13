import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntryEditor } from '@/components/journal/entry-editor'

export default async function NewEntryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-svh bg-background">
      <EntryEditor userId={user.id} />
    </div>
  )
}
