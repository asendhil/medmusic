import React, { useEffect, useState } from "react";
import { fetchSpotifyData, fetchPlaylists } from "../../spotify";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaPause, FaForward, FaBackward } from "react-icons/fa";
import "../../index.css";

// ✅ Declare Spotify Web Playback API globally
declare global {
  interface Window {
    Spotify: any;
  }
}

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

const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [player, setPlayer] = useState<any | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSpotifyData(token).then(setUser);
    fetchPlaylists(token).then(setPlaylists);
  }, [token]);

  useEffect(() => {
    const checkForSpotify = () => {
      if (window.Spotify) {
        initializePlayer();
      } else {
        console.warn("⚠️ Spotify SDK not loaded yet, retrying...");
        setTimeout(checkForSpotify, 500); // ✅ Retry every 500ms until loaded
      }
    };
  
    const initializePlayer = () => {
      const newPlayer = new window.Spotify.Player({
        name: "MedMusic Web Player",
        getOAuthToken: (cb: (token: string) => void) => cb(token),
        volume: 0.5,
      });
  
      setPlayer(newPlayer);
  
      newPlayer.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("✅ Spotify Player Ready! Device ID:", device_id);
        setDeviceId(device_id);
      });
  
      newPlayer.addListener("not_ready", ({ device_id }: { device_id: string }) => {
        console.log("⚠️ Spotify Player Not Ready. Device ID:", device_id);
      });
  
      newPlayer.connect();
    };
  
    checkForSpotify();
  }, [token]);
  
  
  

  const handlePlay = async (trackUri: string) => {
    if (!deviceId) {
      alert("Error: Spotify Web Player is not ready. Device ID is missing.");
      return;
    }
  
    console.log("▶️ Playing on Device ID:", deviceId);
  
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      body: JSON.stringify({ uris: [trackUri] }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  };
  
  const handlePause = async () => {
    await fetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setIsPlaying(false);
  };

  const handleNext = async () => {
    await fetch("https://api.spotify.com/v1/me/player/next", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const handlePrevious = async () => {
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

      <h2>Your Playlists</h2>
      <div className="playlist-list">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="playlist-item" onClick={() => navigate(`/playlist/${playlist.id}`)}>
            <img src={playlist.images[0]?.url} alt="Playlist Cover" className="playlist-cover" />
            <div className="playlist-info">
              <h3 className="playlist-title">{playlist.name}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Player Controls */}
      {currentTrack && (
        <div className="player-controls">
          <button onClick={handlePrevious}><FaBackward /></button>
          <button onClick={isPlaying ? handlePause : () => handlePlay(currentTrack!)}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button onClick={handleNext}><FaForward /></button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
