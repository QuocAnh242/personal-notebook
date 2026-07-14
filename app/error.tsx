'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error('Route Error Boundary caught:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
        <AlertCircle className="size-6 text-red-600 dark:text-red-500" />
      </div>
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
        Oops! Something went wrong.
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Don't worry, your data is safe. We've encountered an unexpected error while trying to load this page.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default" className="w-32">
          Try again
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline" className="w-32">
          Go Home
        </Button>
      </div>
    </div>
  )
}
