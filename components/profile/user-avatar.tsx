import { cn } from '@/lib/utils'

export function UserAvatar({
  username,
  avatarUrl,
  size = 'md',
  className,
}: {
  username: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClass = {
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-12 text-base',
  }[size]

  const initial = username?.charAt(0).toUpperCase() ?? '?'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username ?? 'User'}
        className={cn(
          'shrink-0 rounded-full object-cover ring-2 ring-border/40',
          sizeClass,
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 font-serif font-semibold text-primary ring-2 ring-border/40',
        sizeClass,
        className,
      )}
    >
      {initial}
    </div>
  )
}
