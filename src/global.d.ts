export {};

declare global {
  interface Window {
    Spotify: any; // ✅ Declares the Spotify Web Playback SDK globally
  }
}
