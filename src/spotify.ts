// src/spotify.ts

const CLIENT_ID = "fa3ca1ebe37a412c966ebdfca389a02d";
const REDIRECT_URI = "http://localhost:5173/";
const AUTH_URL = `https://accounts.spotify.com/authorize?
client_id=${CLIENT_ID}
&response_type=token
&redirect_uri=${encodeURIComponent(REDIRECT_URI)}
&scope=user-read-private%20user-read-email%20
user-read-playback-state%20user-modify-playback-state%20
streaming%20app-remote-control%20user-library-read%20
user-library-modify%20user-read-currently-playing`; // ✅ ADDED `user-read-currently-playing`

export const loginWithSpotify = (): void => {
  window.location.href = AUTH_URL;
};

export const getTokenFromUrl = () => {
  try {
    return window.location.hash
      .substring(1)
      .split("&")
      .reduce((initial: any, item) => {
        let parts = item.split("=");
        initial[parts[0]] = decodeURIComponent(parts[1]);
        return initial;
      }, {});
  } catch (error) {
    console.error("❌ Error parsing token from URL:", error);
    return {};
  }
};

export const fetchSpotifyData = async (token: string): Promise<any> => {
  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching Spotify data:", error);
  }
};

export const fetchPlaylists = async (token: string): Promise<any> => {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return (await response.json()).items;
  } catch (error) {
    console.error("❌ Error fetching Spotify playlists:", error);
  }
};

export const fetchPlaylistTracks = async (playlistId: string, token: string | null) => {
  if (!token) {
    console.error("❌ No access token found");
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
      throw new Error(`❌ Failed to fetch playlist tracks: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.items) {
      console.error("❌ Unexpected API response", data);
      return [];
    }

    return data.items.map((item: any) => ({
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists.map((artist: any) => artist.name),
      preview_url: item.track.preview_url,
    }));
  } catch (error) {
    console.error("❌ Error fetching playlist tracks:", error);
    return [];
  }
};

export const searchSpotifyTracks = async (query: string, token: string | null) => {
  if (!token || query.trim() === "") {
    console.error("❌ No access token or empty search query");
    return [];
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`❌ Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("🔎 Spotify API Response:", data.tracks.items);

    return data.tracks.items.map((track: any) => {
      const artist = track.artists?.[0]; // ✅ Extract first artist safely
      console.log(`🎤 Extracted Artist ID: ${artist?.id}, Name: ${artist?.name}`);

      return {
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist: any) => artist.name),
        artistId: artist?.id || null, // ✅ Ensure artist ID is properly assigned
        preview_url: track.preview_url || null,
        albumCover: track.album.images[0]?.url || "",
      };
    });
  } catch (error) {
    console.error("❌ Error searching Spotify tracks:", error);
    return [];
  }
};

// ✅ Fetch artist genres
export const getArtistGenres = async (artistId: string, token: string | null): Promise<string[]> => {
  if (!token || !artistId) {
    console.error("❌ No access token or artist ID");
    return [];
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`❌ Failed to fetch artist data: ${response.statusText}`);
    }

    const artistData = await response.json();
    console.log(`🎼 Fetched Artist Data:`, artistData);

    return artistData.genres || []; // ✅ Ensure genres are returned as an array
  } catch (error) {
    console.error("❌ Error fetching artist genres:", error);
    return [];
  }
};

// ✅ AI genre summary using Cloudflare Workers
export async function run(model: string, input: { messages: { role: string; content: string }[] }) {
  try {
    const response = await fetch(
      `https://cors-anywhere.herokuapp.com/https://api.cloudflare.com/client/v4/accounts/4846d821449cb759344a3835103dcef6/ai/run/${model}`,
      {
        headers: { Authorization: "Bearer Y3-EO6gvkLe1k5G1fRQUiVVAGoK-3eHJe54zgCmz" },
        method: "POST",
        body: JSON.stringify(input),
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("❌ Error calling AI API:", error);
    return { response: "No AI summary available." };
  }
}
