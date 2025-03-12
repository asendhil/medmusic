declare global {
    interface Window {
      Spotify: {
        Player: new (options: {
          name: string;
          getOAuthToken: (cb: (token: string) => void) => void;
          volume?: number;
        }) => Spotify.Player;
      };
    }
  
    namespace Spotify {
      interface Player {
        connect(): Promise<boolean>;
        disconnect(): void;
        togglePlay(): void;
        pause(): void;
        resume(): void;
        nextTrack(): void;
        previousTrack(): void;
        addListener(event: string, callback: Function): void;
      }
    }
  }
  
  export {};
  