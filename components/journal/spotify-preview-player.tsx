'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Disc, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SpotifyPreviewPlayerProps = {
  previewUrl: string
  albumArt: string
  title: string
  artists: string
  spotifyUrl: string
}

export function SpotifyPreviewPlayer({
  previewUrl,
  albumArt,
  title,
  artists,
  spotifyUrl,
}: SpotifyPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(previewUrl)
    audioRef.current = audio

    const updateProgress = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100 || 0)
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    };

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
    };

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    };
  }, [previewUrl])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((err) => console.error('Audio play failed:', err))
      setIsPlaying(true)
    }
  }

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-md transition-all duration-300 hover:shadow-lg dark:bg-card/60">
      {/* Decorative blurred background */}
      <div
        className="absolute inset-0 -z-10 opacity-5 dark:opacity-10 blur-2xl transition-transform duration-1000"
        style={{
          backgroundImage: `url(${albumArt})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Album Art & Rotating Disc */}
        <div className="relative group shrink-0 size-20 sm:size-24 select-none">
          <img
            src={albumArt}
            alt={title}
            className={`size-full rounded-xl object-cover shadow-md transition-transform duration-500 group-hover:scale-105 ${
              isPlaying ? 'animate-[spin_10s_linear_infinite] rounded-full' : ''
            }`}
          />
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-5 rounded-full bg-background border border-border shadow-inner flex items-center justify-center">
                <div className="size-1.5 rounded-full bg-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Info & Player Controls */}
        <div className="flex-1 w-full min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-serif text-lg font-semibold text-foreground truncate leading-snug">
                {title}
              </h4>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {artists}
              </p>
            </div>
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:text-emerald-600 transition-colors duration-150 shrink-0 self-center"
              title="Open in Spotify"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden cursor-pointer">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || 30)}</span>
            </div>
          </div>
        </div>

        {/* Main Action Button */}
        <div className="shrink-0">
          <Button
            size="icon"
            variant="outline"
            onClick={togglePlay}
            className={`size-12 rounded-full border-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
              isPlaying
                ? 'border-emerald-500/30 text-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-border text-foreground hover:border-emerald-500 hover:text-emerald-500'
            }`}
          >
            {isPlaying ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="size-5 fill-current ml-0.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
