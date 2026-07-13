import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <AuthShell
      title="Something went wrong"
      subtitle="We couldn't complete that request."
    >
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {params?.error
            ? `Error: ${params.error}`
            : 'An unspecified error occurred. Please try again.'}
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
