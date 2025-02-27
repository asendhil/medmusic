// src/spotify.ts

const CLIENT_ID = "fa3ca1ebe37a412c966ebdfca389a02d";
const REDIRECT_URI = "http://localhost:5173/";
const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-read-private user-read-email playlist-read-private`;

export const loginWithSpotify = (): void => {
  window.location.href = AUTH_URL;
};

export const getTokenFromUrl = (): { access_token?: string } => {
  return window.location.hash
    .substring(1)
    .split("&")
    .reduce((initial: any, item) => {
      let parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {});
};

export const fetchSpotifyData = async (token: string): Promise<any> => {
  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching Spotify data", error);
  }
};

export const fetchPlaylists = async (token: string): Promise<any> => {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return (await response.json()).items;
  } catch (error) {
    console.error("Error fetching Spotify playlists", error);
  }
};
