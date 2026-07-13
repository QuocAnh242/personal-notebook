import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Page() {
  return (
    <AuthShell
      title="Check your email"
      subtitle="We sent you a confirmation link."
    >
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Please confirm your account through the link in your inbox, then come
          back to sign in and start writing.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
