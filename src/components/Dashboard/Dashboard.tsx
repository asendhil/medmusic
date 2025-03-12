import React, { useEffect, useState } from "react";
import { fetchSpotifyData, fetchPlaylists } from "../../spotify";
import "/src/index.css"; // ✅ Use global styles from src/index.css

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
        setDeviceId(device_id);
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

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user?.display_name}!</h1>

      <div className="tab-menu">
        <button className="tab-button" onClick={() => setSearchResults([])}>Your Library</button>
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
    </div>
  );
};

export default Dashboard;
