import { useCallback } from 'react'
import styles from './Controls.module.css'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ControlsProps {
  /** Whether audio is currently playing */
  isPlaying: boolean
  /** Current playback position in seconds */
  currentTime: number
  /** Total track duration in seconds */
  duration: number
  /** Current volume 0–1 */
  volume: number
  /** Whether there is a loaded track at all */
  hasTrack: boolean
  /** Whether a previous track exists */
  hasPrev: boolean
  /** Whether a next track exists */
  hasNext: boolean
  onPlayPause: () => void
  onPrev: () => void
  onNext: () => void
  /** Called with new time in seconds when user scrubs */
  onSeek: (time: number) => void
  /** Called with new volume 0–1 when user adjusts */
  onVolumeChange: (volume: number) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Controls({
  isPlaying,
  currentTime,
  duration,
  volume,
  hasTrack,
  hasPrev,
  hasNext,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
}: ControlsProps) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const volumePercent = volume * 100

  // Progress bar scrub
  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = (Number(e.target.value) / 100) * duration
      onSeek(newTime)
    },
    [duration, onSeek],
  )

  // Volume change
  const handleVolume = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onVolumeChange(Number(e.target.value) / 100)
    },
    [onVolumeChange],
  )

  // Keyboard seek — left/right arrows jump ±5 s
  const handleSeekKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 5))
      if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + 5))
    },
    [currentTime, duration, onSeek],
  )

  const volumeIcon =
    volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : volume < 0.75 ? '🔉' : '🔊'

  return (
    <div className={styles.controls}>
      {/* ── Progress bar ───────────────────────────────────── */}
      <div className={styles.progressRow}>
        <span className={styles.time}>{formatTime(currentTime)}</span>

        <div className={styles.progressTrack}>
          {/* Filled portion — driven by CSS custom property */}
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            className={styles.progressInput}
            min={0}
            max={100}
            step={0.1}
            value={progressPercent}
            disabled={!hasTrack}
            onChange={handleSeek}
            onKeyDown={handleSeekKey}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          />
        </div>

        <span className={styles.time}>{formatTime(duration)}</span>
      </div>

      {/* ── Playback buttons + volume ──────────────────────── */}
      <div className={styles.buttonRow}>
        {/* Prev */}
        <button
          className={styles.btn}
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Previous track"
          title="Previous (⏮)"
        >
          <span aria-hidden="true">⏮</span>
        </button>

        {/* Play / Pause */}
        <button
          className={`${styles.btn} ${styles.btnPlay}`}
          onClick={onPlayPause}
          disabled={!hasTrack}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          <span aria-hidden="true">{isPlaying ? '⏸' : '▶'}</span>
        </button>

        {/* Next */}
        <button
          className={styles.btn}
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next track"
          title="Next (⏭)"
        >
          <span aria-hidden="true">⏭</span>
        </button>

        {/* Volume */}
        <div className={styles.volumeGroup}>
          <span className={styles.volumeIcon} aria-hidden="true">
            {volumeIcon}
          </span>
          <div className={styles.volumeTrack}>
            <div
              className={styles.volumeFill}
              style={{ width: `${volumePercent}%` }}
            />
            <input
              type="range"
              className={styles.volumeInput}
              min={0}
              max={100}
              step={1}
              value={volumePercent}
              onChange={handleVolume}
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(volumePercent)}
              aria-valuetext={`${Math.round(volumePercent)}%`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
