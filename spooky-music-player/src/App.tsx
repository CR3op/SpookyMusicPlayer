import Controls from './components/Controls'
import DropZone from './components/DropZone'
import { PRESET_TRACKS } from './data/presetTracks'
import { useDropZone } from './hooks/useDropZone'
import { usePlayer } from './hooks/usePlayer'
import './App.css'

export default function App() {
  // ── Playlist ─────────────────────────────────────────────
  const { tracks, isDragOver, onDrop, onDragOver, onDragLeave } =
    useDropZone(PRESET_TRACKS)

  // ── Playback engine ──────────────────────────────────────
  const {
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    currentTrack,
    togglePlay,
    prev,
    next,
    selectTrack,
    seek,
    setVolume,
    audioRef,
  } = usePlayer(tracks)

  return (
    <div
      className="app-layout"
      onDrop={onDrop as React.DragEventHandler<HTMLDivElement>}
      onDragOver={onDragOver as React.DragEventHandler<HTMLDivElement>}
      onDragLeave={onDragLeave}
    >
      {/* ── Background bats ─────────────────────────────── */}
      <div className="bat bat-1" aria-hidden="true">🦇</div>
      <div className="bat bat-2" aria-hidden="true">🦇</div>
      <div className="bat bat-3" aria-hidden="true">🦇</div>

      {/* ── Header ──────────────────────────────────────── */}
      <header className="header">
        <h1 className="title">🎃 Spooky Player 🎃</h1>
        <p className="subtitle">Embrace the darkness… and the music</p>
      </header>

      {/* ── Player card ─────────────────────────────────── */}
      <main className="player-card">

        {/* Now Playing */}
        <section className="now-playing">
          <div
            className={`artwork ${isPlaying ? 'artwork--pulsing' : ''}`}
            aria-hidden="true"
          >
            🎃
          </div>
          <div className="track-info">
            <p className="track-name">
              {currentTrack ? currentTrack.name : 'No track loaded'}
            </p>
            {tracks.length > 1 && (
              <p className="track-count">
                {currentIndex + 1} / {tracks.length}
              </p>
            )}
          </div>
        </section>

        {/* Playback controls */}
        <Controls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          hasTrack={!!currentTrack}
          hasPrev={tracks.length > 1}
          hasNext={tracks.length > 1}
          onPlayPause={togglePlay}
          onPrev={prev}
          onNext={next}
          onSeek={seek}
          onVolumeChange={setVolume}
        />

        {/* Drop zone + playlist */}
        <DropZone
          isDragOver={isDragOver}
          tracks={tracks}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onTrackSelect={selectTrack}
        />
      </main>

      {/* Hidden audio element — owned by usePlayer via audioRef */}
      <audio ref={audioRef} preload="metadata" />
    </div>
  )
}
