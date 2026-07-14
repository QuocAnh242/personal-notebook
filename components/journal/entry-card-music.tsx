'use client'

import { useEffect, useState, useRef } from 'react'
import { Play, Pause, Music } from 'lucide-react'

type EntryCardMusicProps = {
  previewUrl: string
  title: string
  artists: string
  albumArt: string
}

export function EntryCardMusic({
  previewUrl,
  title,
  artists,
  albumArt,
}: EntryCardMusicProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = new Audio(previewUrl)
    audioRef.current = audio

    const handleEnded = () => {
      setIsPlaying(false)
    }
    audio.addEventListener('ended', handleEnded)

    // Stop event listener to pause other playing items
    const handleStopAll = () => {
      audio.pause()
      setIsPlaying(false)
    }
    window.addEventListener('stop-all-card-audio', handleStopAll)

    // Intersection Observer to stop audio when scrolled out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && audio && !audio.paused) {
          audio.pause()
          setIsPlaying(false)
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      audio.pause()
      audio.removeEventListener('ended', handleEnded)
      window.removeEventListener('stop-all-card-audio', handleStopAll)
      observer.disconnect()
    }
  }, [previewUrl])

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent link navigation
    e.preventDefault()

    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      // Stop all other playing card audios first
      window.dispatchEvent(new CustomEvent('stop-all-card-audio'))
      audioRef.current.play().catch((err) => console.error(err))
      setIsPlaying(true)
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={togglePlay}
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs max-w-[240px] truncate transition-all duration-300 cursor-pointer select-none ${
        isPlaying
          ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 font-semibold'
          : 'border-emerald-500/10 bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
      }`}
    >
      {albumArt ? (
        <img
          src={albumArt}
          alt={title}
          className={`size-4 rounded-full object-cover shrink-0 ${
            isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
          }`}
        />
      ) : (
        <Music className="size-3 shrink-0" />
      )}
      <span className="truncate flex-1">
        {title} • {artists}
      </span>
      <div className="shrink-0 flex items-center justify-center size-4 rounded-full bg-emerald-500 text-white transition-all duration-200 hover:bg-emerald-600">
        {isPlaying ? (
          <Pause className="size-2 fill-current" />
        ) : (
          <Play className="size-2 fill-current ml-[1px]" />
        )}
      </div>
    </div>
  )
}
