import { useCallback, useEffect, useRef, useState } from 'react'
import type { Track } from './useDropZone'

// ─── Public surface ───────────────────────────────────────────────────────────

export interface PlayerState {
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  currentTrack: Track | null
}

export interface PlayerActions {
  /** Start or resume playback */
  play: () => void
  /** Pause playback */
  pause: () => void
  /** Toggle play/pause */
  togglePlay: () => void
  /**
   * Go to previous track.
   * If more than RESTART_THRESHOLD seconds have elapsed, restart the current
   * track instead. At the first track, restarts from 0.
   */
  prev: () => void
  /**
   * Go to next track.
   * Wraps around to the first track when at the end.
   */
  next: () => void
  /** Jump to a specific track index and start playing */
  selectTrack: (index: number) => void
  /** Seek to an absolute position in seconds */
  seek: (seconds: number) => void
  /** Set volume 0–1 */
  setVolume: (volume: number) => void
  /** Ref to pass to the <audio> element */
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export type UsePlayerReturn = PlayerState & PlayerActions

// ─── Constants ────────────────────────────────────────────────────────────────

/** If currentTime exceeds this (seconds), prev() restarts rather than going back */
const RESTART_THRESHOLD = 3

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlayer(tracks: Track[]): UsePlayerReturn {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying]       = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [duration, setDuration]         = useState(0)
  const [volume, setVolumeState]        = useState(0.8)

  // Mirror current index in a ref so event handlers always read the latest
  // value without needing it in their dependency arrays.
  const currentIndexRef = useRef(currentIndex)
  currentIndexRef.current = currentIndex

  const tracksRef = useRef(tracks)
  tracksRef.current = tracks

  const currentTrack = tracks[currentIndex] ?? null

  // ── Load a new src whenever the active track changes ────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!currentTrack) {
      audio.src = ''
      setCurrentTime(0)
      setDuration(0)
      return
    }

    const wasPlaying = !audio.paused

    audio.src = currentTrack.url
    setCurrentTime(0)
    setDuration(0)

    // Resume automatically only if something was already playing
    if (wasPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    }
  // currentTrack identity changes when currentIndex or tracks array changes.
  // isPlaying is intentionally NOT a dep — we read the live audio state instead.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack])

  // ── Keep <audio> volume in sync ──────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // ── Subscribe to audio element events ───────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleDurationChange = () => {
      setDuration(isFinite(audio.duration) ? audio.duration : 0)
    }

    const handlePlay  = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleEnded = () => {
      const list  = tracksRef.current
      const index = currentIndexRef.current

      if (list.length === 0) return

      // Always wrap to first track after the last one
      const nextIndex = index < list.length - 1 ? index + 1 : 0

      if (nextIndex === index) {
        // Single track: just restart
        audio.currentTime = 0
        audio.play().catch(() => setIsPlaying(false))
      } else {
        setCurrentIndex(nextIndex)
        // play() will fire once the new src is set (useEffect above)
        setIsPlaying(true)
      }
    }

    audio.addEventListener('timeupdate',     handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('play',           handlePlay)
    audio.addEventListener('pause',          handlePause)
    audio.addEventListener('ended',          handleEnded)

    return () => {
      audio.removeEventListener('timeupdate',     handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('play',           handlePlay)
      audio.removeEventListener('pause',          handlePause)
      audio.removeEventListener('ended',          handleEnded)
    }
  // Empty dep array: attach once — handlers close over refs, not stale state.
  }, [])

  // ── Actions ──────────────────────────────────────────────────────────────────

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => setIsPlaying(false))
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [])

  const prev = useCallback(() => {
    const audio = audioRef.current
    const index = currentIndexRef.current

    // If we're past the restart threshold, go back to the start of this track
    if (audio && audio.currentTime > RESTART_THRESHOLD) {
      audio.currentTime = 0
      setCurrentTime(0)
      return
    }

    // At the first track: just restart from 0
    if (index === 0) {
      if (audio) {
        audio.currentTime = 0
        setCurrentTime(0)
      }
      return
    }

    setCurrentIndex(index - 1)
  }, [])

  const next = useCallback(() => {
    const list  = tracksRef.current
    const index = currentIndexRef.current

    if (list.length === 0) return

    // Wrap around to the first track when at the end
    const nextIndex = index < list.length - 1 ? index + 1 : 0
    setCurrentIndex(nextIndex)
  }, [])

  const selectTrack = useCallback((index: number) => {
    const list = tracksRef.current
    if (index < 0 || index >= list.length) return

    if (index === currentIndexRef.current) {
      // Same track: toggle play/pause
      togglePlay()
    } else {
      setCurrentIndex(index)
      setIsPlaying(true)
    }
  }, [togglePlay])

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    const clamped = Math.max(0, Math.min(seconds, audio.duration || 0))
    audio.currentTime = clamped
    setCurrentTime(clamped)
  }, [])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
  }, [])

  // ── Derived state: keep isPlaying honest when tracks list goes empty ─────────
  useEffect(() => {
    if (tracks.length === 0) {
      audioRef.current?.pause()
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      setCurrentIndex(0)
    }
  }, [tracks.length])

  return {
    // State
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    currentTrack,
    // Actions
    play,
    pause,
    togglePlay,
    prev,
    next,
    selectTrack,
    seek,
    setVolume,
    audioRef,
  }
}
