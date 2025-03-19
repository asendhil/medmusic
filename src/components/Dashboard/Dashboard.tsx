import React, { useEffect, useState, useRef } from "react";
import { fetchSpotifyData, fetchPlaylists, getArtistGenres, searchSpotifyTracks, run } from "../../spotify";
import "../../index.css"; // ✅ Use global styles from src/index.css

interface DashboardProps {
  token: string;
}

interface User {
  display_name: string;
}

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

interface Artist {
  id: string;
  name: string;
}

interface Track {
  id: string;
  name: string;
  uri: string;
  preview_url: string | null;
  album: { images: { url: string }[] };
  artists: Artist[];
}

// 🎨 Genre color mapping
const genreColorMap: { [key: string]: string } = {
  pop: "#ff9ff3",
  rock: "#ff6b6b",
  jazz: "#feca57",
  hiphop: "#48dbfb",
  classical: "#1dd1a1",
  electronic: "#5f27cd",
  metal: "#d63031",
  country: "#eccc68",
  blues: "#0652DD",
  reggae: "#10ac84",
  folk: "#8395a7",
  indie: "#f368e0",
  funk: "#ff9f43",
  soul: "#ff6348",
  default: "#222f3e",
};

const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [topAlbums, setTopAlbums] = useState<{ id: string; name: string; image: string }[]>([]);
  const [topPlaylists, setTopPlaylists] = useState<Playlist[]>([]);

  const [genreColor, setGenreColor] = useState<string>(genreColorMap.default);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchSpotifyData(token).then(setUser);
    fetchPlaylists(token).then(setPlaylists);
  }, [token]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    // ✅ Resize canvas to match full window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawBackground(ctx); // ✅ Draw initial background
    };
  
    // ✅ Function to draw the color background
    const drawBackground = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = genreColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
  
    // ✅ Handle window resizing
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas(); // Ensure full size on load
  
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [genreColor]); // ✅ Re-run when `genreColor` changes
  

  useEffect(() => {
    const initializePlayer = () => {
      const newPlayer = new window.Spotify.Player({
        name: "MedMusic Web Player",
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      });

      setPlayer(newPlayer);

      newPlayer.addListener("ready", ({ device_id }) => {
        setDeviceId(device_id);
      });

      newPlayer.addListener("player_state_changed", async (state) => {
        if (!state || !state.track_window.current_track) return;

        setIsPlaying(!state.paused);
        setCurrentTime(state.position / 1000);
        setTrackDuration(state.duration / 1000);

        const trackId = state.track_window.current_track.id;

        try {
          const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!trackResponse.ok) throw new Error("Failed to fetch track details.");
          const trackData = await trackResponse.json();

          const firstArtist = trackData.artists?.[0];
          const artistId = firstArtist?.id || "unknown";

          setCurrentTrack({
            id: trackData.id,
            name: trackData.name,
            uri: trackData.uri,
            preview_url: trackData.preview_url || null,
            album: trackData.album,
            artists: trackData.artists.map((artist: { id: string; name: string }) => ({
              id: artist.id,
              name: artist.name,
            })),
          });
          

          if (artistId !== "unknown") {
            const genres = await getArtistGenres(artistId, token);
            const primaryGenre = genres[0] || "default";
            setGenreColor(genreColorMap[primaryGenre] || genreColorMap.default);

            if (genres.length > 0) {
              run("@cf/meta/llama-3-8b-instruct", {
                messages: [
                  { role: "system", content: "You are a friendly assistant" },
                  { role: "user", content: `Write a 1-line summary about these music genres: ${genres.join(", ")}` },
                ],
              }).then((response) => {
                const aiText = response.result?.response || "No AI summary available.";
                setAiSummary(aiText);
              });
            }
          }
        } catch (error) {
          console.error("❌ Error fetching track details:", error);
        }
      });

      newPlayer.connect();
    };

    if (window.Spotify) {
      initializePlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    }
  }, [token]);

  useEffect(() => {
    const fetchTopTracks = async () => {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
    
        if (!response.ok) throw new Error(`Failed to fetch top tracks: ${response.statusText}`);
    
        const data = await response.json();
        console.log("🎵 Top Tracks Response:", data);
    
        // Extract unique albums from the top tracks
        const albums: { id: string; name: string; image: string }[] = data.items
          .map((track: { album: { id: string; name: string; images: { url: string }[] } }) => ({
            id: track.album.id,
            name: track.album.name,
            image: track.album.images[0]?.url || "",
          }))
          .filter(
            (album: { id: string }, index: number, self: { id: string }[]) =>
              self.findIndex((a) => a.id === album.id) === index
          ) // Deduplicate albums
          .slice(0, 8); // Limit to 8
    
        setTopAlbums(albums);
      } catch (error) {
        console.error("🚨 Error fetching top albums:", error);
      }
    };
    
  
    fetchTopTracks();
  }, [token]);

useEffect(() => {
  const fetchUserPlaylists = async () => {
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=8`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Failed to fetch playlists: ${response.statusText}`);

      const data = await response.json();
      console.log("📂 User Playlists Response:", data);

      setTopPlaylists(data.items);
    } catch (error) {
      console.error("🚨 Error fetching user playlists:", error);
    }
  };

  fetchUserPlaylists();
}, [token]);


  useEffect(() => {
    if (!player || !isPlaying) return;
  
    // Update progress every second while playing
    const interval = setInterval(async () => {
      const state = await player.getCurrentState();
      if (!state) return;
  
      setCurrentTime(state.position / 1000); // Convert ms to seconds
      setTrackDuration(state.duration / 1000); // Convert ms to seconds
    }, 1000); // ✅ Updates every second
  
    return () => clearInterval(interval); // ✅ Cleanup on unmount
  }, [player, isPlaying]);
  

  const handlePlay = async (track: Track) => {
    if (!deviceId) return alert("No active Spotify player found.");
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [track.uri] }),
    });
  };

  const handlePause = async () => {
    if (!deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setIsPlaying(false); // ✅ Update UI state
  };
  
  const handleResume = async () => {
    if (!deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setIsPlaying(true); // ✅ Update UI state
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleNextTrack = async () => {
    if (!deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };
  
  const handlePreviousTrack = async () => {
    if (!deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };
  
  const handleSeek = async (position: number) => {
    if (!deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${position * 1000}&device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setCurrentTime(position); // ✅ Ensure UI updates instantly
  };
  

  const handleSearch = async () => {
    if (!searchTerm) return;
  
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
  
      const data = await response.json();
  
      if (!data.tracks || !data.tracks.items) {
        throw new Error("Unexpected API response format.");
      }
  
      console.log("🎵 Search API Response:", data);
  
      setSearchResults(
        data.tracks.items.map((track: any) => ({
          id: track.id,
          name: track.name,
          uri: track.uri,
          preview_url: track.preview_url || null,
          album: track.album || { images: [{ url: "" }] },
          artists: track.artists.map((artist: { id: string; name: string }) => ({
            id: artist.id,
            name: artist.name,
          })),
        }))
      );
    } catch (error) {
      console.error("🚨 Error in handleSearch:", error);
      alert("An error occurred while fetching search results. Please try again.");
    }
  };
  

  return (
    <div className="dashboard-container">
  <h1>Welcome, {user?.display_name}!</h1>

  {/* 🔍 Search Section (Contains both Search Bar & Results) */}
  <div className="search-container">
    <div className="search-tab">
      <input
        type="text"
        placeholder="Search for a song..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
    </div>

    {/* 🔎 Search Results (Now Positioned Closer) */}
    <div className="search-results">
      {searchResults.map((track) => (
        <div key={track.id} className="search-result-item">
          <img src={track.album.images[0]?.url} alt="Track Cover" className="search-track-cover" />
          <div className="search-track-info">
            <h3>{track.name}</h3>
            <p>{track.artists.map((artist) => artist.name).join(", ")}</p>
          </div>
          <button onClick={() => handlePlay(track)} className="search-play-button">▶️</button>
        </div>
      ))}
    </div>
  </div>

  {/* 🎨 AI Summary Box */}
  <div className="ai-summary-box">
    <h3>AI Genre Summary</h3>
    <p>{aiSummary || "Play a song to see the genre summary!"}</p>
  </div>

  <div className="recent-container">
    {/* 🎶 Top Playlists */}
    <div className="top-playlists">
      <h3>Top Playlists</h3>
      <div className="playlist-grid">
        {topPlaylists.map((playlist) => (
          <div key={playlist.id} className="playlist-item">
            <img src={playlist.images[0]?.url} alt="Playlist Cover" className="playlist-cover" />
            <p>{playlist.name}</p>
          </div>
        ))}
      </div>
    </div>

    {/* 🎵 Top Albums */}
    <div className="top-albums">
      <h3>Top Albums</h3>
      <div className="album-grid">
        {topAlbums.map((album) => (
          <div key={album.id} className="album-item">
            <img src={album.image} alt="Album Cover" className="album-cover" />
            <p>{album.name}</p>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* 🎨 Canvas for Genre-Based Visualization */}
  <canvas ref={canvasRef} className="background-visualization"></canvas>

  {/* 🎶 Bottom Music Player */}
{currentTrack && (
  <div className="player-bar">
    
    {/* 🎵 Album Cover & Song Details */}
    <div className="player-info">
      <img src={currentTrack.album.images[0]?.url} alt="Album Cover" className="player-album-cover" />
      <div className="player-song-details">
        <h3>{currentTrack.name}</h3>
        <p>{currentTrack.artists.map((artist) => artist.name).join(", ")}</p>
      </div>
    </div>

    {/* 🎮 Player Controls */}
    <div className="player-controls">
      <button onClick={handlePreviousTrack} className="player-button">⏮️</button>
      {isPlaying ? (
        <button onClick={handlePause} className="player-button">⏸️</button>
      ) : (
        <button onClick={handleResume} className="player-button">▶️</button>
      )}
      <button onClick={handleNextTrack} className="player-button">⏭️</button>
    </div>

    {/* ⏳ Progress Bar & Time Display */}
    <div className="player-progress-container">
      <span className="player-time">{formatTime(currentTime)}</span>
      <input
        type="range"
        min="0"
        max={trackDuration}
        value={currentTime}
        onChange={(e) => handleSeek(Number(e.target.value))}
        className="player-progress-slider"
      />
      <span className="player-time">{formatTime(trackDuration)}</span>
    </div>
  </div>
)}

</div>

  );
};

export default Dashboard;
