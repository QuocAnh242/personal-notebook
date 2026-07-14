import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function Page() {
  return (
    <AuthShell
      title="Email confirmed"
      subtitle="Your notebook is ready — welcome to Morrow."
    >
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-6 text-primary" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your email has been verified. You can start writing, share with friends,
          and explore The Echoes.
        </p>
        <Button asChild className="w-full">
          <Link href="/journal">Open your notebook</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/profile">Set up your profile</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
