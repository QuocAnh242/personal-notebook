import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Missing RESEND_API_KEY' }, { status: 500 });
  }
  const resend = new Resend(apiKey);
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'wasasi241224@gmail.com',
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}
