/**
 * Storage abstraction for event imagery and seating maps.
 * Local/dev: URL-based entry or write to public/uploads.
 * Future: swap for Google Cloud Storage adapter.
 */

export type StorageContext =
  | { type: 'event-hero'; parentEventId: string }
  | { type: 'event-gallery'; parentEventId: string }
  | { type: 'seating-map'; eventDateId: string };

export interface StorageAdapter {
  /** Save from URL or return URL as-is in dev. Returns public URL. */
  saveEventImageUrl(url: string, context: StorageContext): Promise<string>;
  /** Placeholder for future file upload. */
  saveEventImageFile?(file: File, context: StorageContext): Promise<string>;
  /** Save seating map URL or file. */
  saveSeatingMapUrl(url: string, eventDateId: string): Promise<string>;
  saveSeatingMapFile?(file: File, eventDateId: string): Promise<string>;
}

/**
 * Local/dev adapter: no filesystem write; accepts URL and returns it.
 * Production should use GCS adapter that uploads and returns bucket URL.
 */
const localAdapter: StorageAdapter = {
  async saveEventImageUrl(url: string, _context: StorageContext) {
    if (!url || typeof url !== 'string') return '';
    return url.trim();
  },
  async saveSeatingMapUrl(url: string, _eventDateId: string) {
    if (!url || typeof url !== 'string') return '';
    return url.trim();
  }
};

let adapter: StorageAdapter = localAdapter;

export function setStorageAdapter(a: StorageAdapter) {
  adapter = a;
}

export function getStorage(): StorageAdapter {
  return adapter;
}
