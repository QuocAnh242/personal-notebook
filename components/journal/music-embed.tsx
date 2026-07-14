import { Music } from 'lucide-react'
import { getSpotifyTrackDetails } from '@/app/journal/actions'
import { SpotifyPreviewPlayer } from './spotify-preview-player'

function toEmbed(url: string): { type: 'iframe' | 'link'; src: string } {
  try {
    const u = new URL(url)
    const host = u.hostname.replace('www.', '').replace('m.', '')

    // Spotify
    if (host === 'open.spotify.com') {
      return { type: 'iframe', src: `https://open.spotify.com/embed${u.pathname}` }
    }

    // YouTube - short links (youtu.be/VIDEO_ID)
    if (host === 'youtu.be') {
      const videoId = u.pathname.slice(1) // remove leading /
      if (videoId) {
        return { type: 'iframe', src: `https://www.youtube.com/embed/${videoId}` }
      }
    }

    // YouTube - standard and mobile links
    if (host === 'youtube.com') {
      // Standard watch: youtube.com/watch?v=VIDEO_ID
      const videoId = u.searchParams.get('v')
      if (videoId) {
        return { type: 'iframe', src: `https://www.youtube.com/embed/${videoId}` }
      }
      // Shorts: youtube.com/shorts/VIDEO_ID
      const shortsMatch = u.pathname.match(/^\/shorts\/(.+)/)
      if (shortsMatch) {
        return { type: 'iframe', src: `https://www.youtube.com/embed/${shortsMatch[1]}` }
      }
      // Embed: youtube.com/embed/VIDEO_ID (already an embed URL)
      if (u.pathname.startsWith('/embed/')) {
        return { type: 'iframe', src: url }
      }
    }
  } catch {
    // fall through to link
  }
  return { type: 'link', src: url }
}

export async function MusicEmbed({ url }: { url: string }) {
  const isSpotify = url.includes('spotify.com')

  if (isSpotify) {
    try {
      const track = await getSpotifyTrackDetails(url)
      if (track && track.previewUrl) {
        return (
          <SpotifyPreviewPlayer
            previewUrl={track.previewUrl}
            albumArt={track.albumArt}
            title={track.name}
            artists={track.artists}
            spotifyUrl={track.url}
          />
        )
      }
    } catch (error) {
      console.error('Error rendering Spotify player:', error)
    }
  }

  // Fallback to standard iframe or link
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
          className={isYouTube ? 'aspect-video w-full' : 'h-[152px] w-full border-none rounded-xl overflow-hidden'}
          style={isYouTube ? {} : { backgroundColor: '#282828' }}
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
