import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ShareEmailRequest {
  entryId: string
  recipientEmail: string
  message?: string
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing RESEND_API_KEY' },
        { status: 500 }
      )
    }

    const body: ShareEmailRequest = await request.json()
    const { entryId, recipientEmail, message } = body

    if (!entryId || !recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user and get entry details
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('id, title, content, user_id, share_slug')
      .eq('id', entryId)
      .single()

    if (entryError || !entry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      )
    }

    if (entry.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Generate share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://morrow.app'}/share/${entry.share_slug}`
    const userEmail = user.email || 'a friend'

    const resend = new Resend(apiKey)
    const data = await resend.emails.send({
      from: 'Morrow <noreply@morrow.app>',
      to: recipientEmail,
      subject: `${userEmail} shared "${entry.title}" with you`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #2c2c2c;">
          <div style="background: linear-gradient(135deg, #f5e6d3 0%, #e8d4c0 100%); padding: 40px; border-radius: 12px; text-align: center;">
            <h1 style="font-family: Georgia, serif; color: #c63b3b; margin: 0; font-size: 28px;">Morrow</h1>
            <p style="color: #7a6a5a; margin: 16px 0 0 0; font-size: 14px;">A quiet place for your story</p>
          </div>
          
          <div style="padding: 40px 20px;">
            <p style="margin: 0 0 16px 0; font-size: 16px;">
              <strong>${userEmail}</strong> shared a note with you:
            </p>
            
            <div style="background: #f9f7f4; border-left: 4px solid #c63b3b; padding: 20px; margin: 24px 0; border-radius: 4px;">
              <h2 style="margin: 0 0 12px 0; font-family: Georgia, serif; color: #2c2c2c; font-size: 20px;">
                ${entry.title || 'Untitled'}
              </h2>
              <p style="margin: 0; color: #666; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">
                ${entry.content.substring(0, 150)}${entry.content.length > 150 ? '...' : ''}
              </p>
            </div>
            
            ${message ? `<p style="color: #666; font-style: italic; margin: 20px 0;">"${message}"</p>` : ''}
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${shareUrl}" style="display: inline-block; background: #c63b3b; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; transition: all 0.3s ease;">
                Read the full note
              </a>
            </div>
            
            <p style="color: #999; font-size: 13px; text-align: center; margin-top: 32px;">
              This note was shared with you anonymously through Morrow.<br>
              You don't need an account to read it.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e0e0e0; padding: 20px; text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 0;">© Morrow • Shared moments, shared stories</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}
