import { Music } from 'lucide-react'

function toEmbed(url: string): { type: 'iframe' | 'link'; src: string } {
  try {
    const u = new URL(url)
    const host = u.hostname.replace('www.', '')

    // Spotify
    if (host === 'open.spotify.com') {
      return { type: 'iframe', src: `https://open.spotify.com/embed${u.pathname}` }
    }

    // YouTube
    if (host === 'youtu.be') {
      return {
        type: 'iframe',
        src: `https://www.youtube.com/embed${u.pathname}`,
      }
    }
    if (host === 'youtube.com' && u.searchParams.get('v')) {
      return {
        type: 'iframe',
        src: `https://www.youtube.com/embed/${u.searchParams.get('v')}`,
      }
    }
  } catch {
    // fall through to link
  }
  return { type: 'link', src: url }
}

export function MusicEmbed({ url }: { url: string }) {
  const embed = toEmbed(url)
  const isYouTube = embed.src.includes('youtube.com/embed')

  if (embed.type === 'iframe') {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <iframe
          src={embed.src}
          title="Song"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className={isYouTube ? 'aspect-video w-full' : 'h-[152px] w-full'}
        />
      </div>
    )
  }

  return (
    <a
      href={embed.src}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/50"
    >
      <Music className="size-4" aria-hidden="true" />
      Listen to the song
    </a>
  )
}
