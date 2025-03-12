import React, { useEffect, useState } from "react";
import { fetchSpotifyData, fetchPlaylists } from "../../spotify";
import "/src/index.css"; // ✅ Absolute import for Vite

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

interface Track {
  id: string;
  name: string;
  uri: string;
  preview_url: string | null;
  album: { images: { url: string }[] };
  artists: { name: string }[];
}

const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchSpotifyData(token).then(setUser);
    fetchPlaylists(token).then(setPlaylists);
  }, [token]);

  useEffect(() => {
    const initializePlayer = () => {
      const newPlayer = new window.Spotify.Player({
        name: "MedMusic Web Player",
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      });

      setPlayer(newPlayer);

      newPlayer.addListener("ready", ({ device_id }) => {
        console.log("Device Ready:", device_id);
        setDeviceId(device_id);
      });

      newPlayer.addListener("player_state_changed", (state) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setCurrentTrack({
          id: state.track_window.current_track.id ?? "unknown", // ✅ Fix: Provide fallback value
          name: state.track_window.current_track.name,
          uri: state.track_window.current_track.uri,
          preview_url: null,
          album: state.track_window.current_track.album,
          artists: state.track_window.current_track.artists,
        });
      });
      

      newPlayer.connect();
    };

    if (window.Spotify) {
      initializePlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    }
  }, [token]);

  const handleSearch = async () => {
    if (!searchTerm) return;

    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.tracks?.items) setSearchResults(data.tracks.items);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  const handlePlay = async (trackUri: string) => {
    if (!deviceId) return alert("No active Spotify player found.");

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [trackUri] }),
    });
  };

  const handlePause = async () => {
    await fetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const handleResume = async () => {
    await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const handleNextTrack = async () => {
    await fetch("https://api.spotify.com/v1/me/player/next", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const handlePreviousTrack = async () => {
    await fetch("https://api.spotify.com/v1/me/player/previous", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user?.display_name}!</h1>

      <div className="tab-menu">
        <button className="tab-button" onClick={() => {
          setSearchResults([]);
          fetchPlaylists(token).then(setPlaylists); // ✅ Fix "Your Library"
        }}>
          Your Library
        </button>
        <button className="tab-button" onClick={handleSearch}>Search</button>
      </div>

      {/* Search Section */}
      <div className="search-tab">
        <input type="text" placeholder="Search for a song..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <button onClick={handleSearch}>Search</button>

        <div className="search-results">
          {searchResults.map((track) => (
            <div key={track.id} className="search-result-item">
              <img src={track.album.images[0]?.url} alt="Track Cover" className="search-track-cover" />
              <div className="search-track-info">
                <h3>{track.name}</h3>
                <p>{track.artists.map((artist) => artist.name).join(", ")}</p>
              </div>
              <button onClick={() => handlePlay(track.uri)}>Play</button>
            </div>
          ))}
        </div>
      </div>

      {/* Playback Controls */}
      {currentTrack && (
        <div className="player-controls">
          <h3>Now Playing: {currentTrack.name} - {currentTrack.artists.map((artist) => artist.name).join(", ")}</h3>
          <button onClick={handlePreviousTrack}>⏮️ Prev</button>
          {isPlaying ? <button onClick={handlePause}>⏸️ Pause</button> : <button onClick={handleResume}>▶️ Play</button>}
          <button onClick={handleNextTrack}>⏭️ Next</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
