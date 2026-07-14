import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function syncProfileEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string | undefined,
) {
  if (!email) return
  await supabase.from('profiles').upsert({ id: userId, email })
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/auth/confirm'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) await syncProfileEmail(supabase, user.id, user.email)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'email_change',
    })
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) await syncProfileEmail(supabase, user.id, user.email)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  const message = searchParams.get('error_description') ?? searchParams.get('error')
  const errorUrl = new URL('/auth/error', origin)
  if (message) errorUrl.searchParams.set('error', message)
  return NextResponse.redirect(errorUrl)
}
