import type { Track } from '../hooks/useDropZone'

/**
 * Bundled Halloween tracks served from /public/songs/.
 * These are loaded automatically when the app starts —
 * no drag & drop required.
 */
export const PRESET_TRACKS: Track[] = [
  {
    id: 'preset-halloween-waltz',
    name: 'Halloween Waltz',
    url: '/songs/bombinsound-halloween-suspense-horror-halloween-waltz-619348.mp3',
    isBlob: false,
  },
  {
    id: 'preset-ernest-mischievous',
    name: 'Ernest The Mischievous',
    url: '/songs/ed-musicproductions-ernest-the-mischievous-638286.mp3',
    isBlob: false,
  },
]
