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

export const fetchPlaylistTracks = async (playlistId: string, token: string | null) => {
  if (!token) {
    console.error("No access token found");
    return [];
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist tracks: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Ensure the response is formatted correctly
    if (!data.items) {
      console.error("Unexpected API response", data);
      return [];
    }

    return data.items.map((item: any) => ({
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists.map((artist: any) => artist.name),
      preview_url: item.track.preview_url, // Useful for playing song previews
    }));
  } catch (error) {
    console.error("Error fetching playlist tracks:", error);
    return [];
  }
};

export const searchSpotifyTracks = async (query: string, token: string | null) => {
  if (!token || query.trim() === "") {
    console.error("No access token or empty search query");
    return [];
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.tracks || !data.tracks.items) {
      console.error("Unexpected API response", data);
      return [];
    }

    return data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => artist.name),
      preview_url: track.preview_url, // Use this for playback
      albumCover: track.album.images[0]?.url || "", // Use first image for album cover
    }));
  } catch (error) {
    console.error("Error searching Spotify tracks:", error);
    return [];
  }
};

