import type { Track } from '../hooks/useDropZone'
import styles from './DropZone.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DropZoneProps {
  isDragOver: boolean
  tracks: Track[]
  currentIndex: number
  isPlaying: boolean
  onDrop: (e: React.DragEvent<HTMLElement>) => void
  onDragOver: (e: React.DragEvent<HTMLElement>) => void
  onDragLeave: () => void
  onTrackSelect: (index: number) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DropZone({
  isDragOver,
  tracks,
  currentIndex,
  isPlaying,
  onDrop,
  onDragOver,
  onDragLeave,
  onTrackSelect,
}: DropZoneProps) {
  const hasAnyTracks = tracks.length > 0

  return (
    <div className={styles.wrapper}>
      {/* ── Drop target ─────────────────────────────────── */}
      <div
        className={[
          styles.dropZone,
          isDragOver ? styles.active : '',
          hasAnyTracks ? styles.compact : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onDrop={onDrop as React.DragEventHandler<HTMLDivElement>}
        onDragOver={onDragOver as React.DragEventHandler<HTMLDivElement>}
        onDragLeave={onDragLeave}
        role="region"
        aria-label="Drop audio files here to add them to the playlist"
        aria-dropeffect="copy"
      >
        {/* Cobweb decorations */}
        <span className={styles.web} aria-hidden="true">🕸️</span>

        {/* Pumpkin — scales up when drag is active */}
        <span
          className={[styles.pumpkin, isDragOver ? styles.pumpkinActive : ''].join(' ')}
          aria-hidden="true"
        >
          🎃
        </span>

        <div className={styles.text}>
          <span className={styles.label}>
            {isDragOver
              ? 'Release to summon your tracks…'
              : hasAnyTracks
              ? 'Drop more tracks to add them'
              : 'Drop audio files here to begin'}
          </span>
          {!hasAnyTracks && (
            <span className={styles.hint}>MP3, WAV, OGG, FLAC and more</span>
          )}
        </div>

        <span className={styles.web} aria-hidden="true">🕸️</span>
      </div>

      {/* ── Playlist ──────────────────────────────────────── */}
      {hasAnyTracks && (
        <ul className={styles.playlist} aria-label="Playlist">
          {tracks.map((track, i) => {
            const isActive = i === currentIndex
            const isCurrentlyPlaying = isActive && isPlaying
            return (
              <li
                key={track.id}
                className={[
                  styles.item,
                  isActive ? styles.itemActive : '',
                ].join(' ')}
                onClick={() => onTrackSelect(i)}
                role="button"
                tabIndex={0}
                aria-label={`Play ${track.name}${isActive ? ' (current track)' : ''}`}
                aria-current={isActive}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onTrackSelect(i)
                  }
                }}
              >
                {/* Track number / playing indicator */}
                <span className={styles.itemIcon} aria-hidden="true">
                  {isCurrentlyPlaying ? (
                    <span className={styles.noteAnim}>♪</span>
                  ) : isActive ? (
                    '▶'
                  ) : (
                    <span className={styles.skullIcon}>💀</span>
                  )}
                </span>

                <span className={styles.itemName}>{track.name}</span>

                {/* Badge for preset (non-blob) tracks */}
                {!track.isBlob && (
                  <span className={styles.presetBadge} aria-label="Preset track">
                    🎵
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
