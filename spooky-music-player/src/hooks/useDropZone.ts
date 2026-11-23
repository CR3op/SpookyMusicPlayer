import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Track {
  /** Stable unique key — either a blob URL (dropped file) or the public path (preset) */
  id: string
  /** Display name — file name without extension */
  name: string
  /** Audio source: blob URL for dropped files, public path for preset tracks */
  url: string
  /** true = created via URL.createObjectURL and must be revoked on cleanup */
  isBlob: boolean
}

export interface UseDropZoneReturn {
  tracks: Track[]
  isDragOver: boolean
  /** Replace the whole playlist (used to seed preset tracks) */
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>
  onDrop: (e: React.DragEvent<HTMLElement>) => void
  onDragOver: (e: React.DragEvent<HTMLElement>) => void
  onDragLeave: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '')
}

/** Readable display label from a raw file name or URL segment */
function labelFromFilename(raw: string): string {
  // Pull the last path segment, decode URI encoding, strip extension
  const segment = raw.split('/').pop() ?? raw
  return stripExtension(decodeURIComponent(segment))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDropZone(initialTracks: Track[] = []): UseDropZoneReturn {
  const [tracks, setTracks] = useState<Track[]>(initialTracks)
  const [isDragOver, setIsDragOver] = useState(false)

  // Keep a ref so the cleanup effect always sees the latest list
  const tracksRef = useRef(tracks)
  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  // Revoke all blob URLs when the component that owns this hook unmounts
  useEffect(() => {
    return () => {
      tracksRef.current
        .filter((t) => t.isBlob)
        .forEach((t) => URL.revokeObjectURL(t.url))
    }
  }, [])

  const onDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)

    // Reject non-audio files silently
    const audioFiles = files.filter((f) => f.type.startsWith('audio/'))
    if (audioFiles.length === 0) return

    setTracks((prev) => {
      // Build a set of existing names to prevent exact-name duplicates
      const existingNames = new Set(prev.map((t) => t.name))

      const newTracks: Track[] = []
      for (const file of audioFiles) {
        const name = labelFromFilename(file.name)

        // Skip if a track with this exact display name is already in the list
        if (existingNames.has(name)) continue

        const url = URL.createObjectURL(file)
        newTracks.push({ id: url, name, url, isBlob: true })
        existingNames.add(name)
      }

      return [...prev, ...newTracks]
    })
  }, [])

  return { tracks, setTracks, isDragOver, onDrop, onDragOver, onDragLeave }
}
