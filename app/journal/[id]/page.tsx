import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntryEditor, type EditableEntry } from '@/components/journal/entry-editor'

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: entry } = await supabase
    .from('entries')
    .select(
      'id, title, content, mood, cover_url, music_url, is_public, share_slug, user_id',
    )
    .eq('id', id)
    .single()

  if (!entry || entry.user_id !== user.id) notFound()

  return (
    <div className="min-h-svh bg-background">
      <EntryEditor userId={user.id} entry={entry as EditableEntry} />
    </div>
  )
}
