import React, { useEffect, useState } from "react";
import { fetchSpotifyData, fetchPlaylists, getArtistGenres, run } from "../../spotify";
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

interface Track {
  id: string;
  name: string;
  uri: string;
  preview_url: string | null;
  artistId: string | null;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);

  const [aiSummary, setAiSummary] = useState<string>("");

  useEffect(() => {
    fetchSpotifyData(token).then(setUser);
    fetchPlaylists(token).then(setPlaylists);
  }, [token]);
  
  // Initialize Spotify Web Playback SDK
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
        if (!state) return;
        setIsPlaying(!state.paused);
        setCurrentTime(state.position / 1000); // Convert ms to seconds
        setTrackDuration(state.duration / 1000); // Convert ms to seconds

        
        
        let artistId = "";
        setCurrentTrack({
          id: state.track_window.current_track.id ?? "unknown",
          name: state.track_window.current_track.name,
          uri: state.track_window.current_track.uri,
          preview_url: null,
          artistId: artistId,
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
  
  // ✅ Automatically Update Progress Bar in Sync with the Song
  useEffect(() => {
    if (!player) return;
  
    const interval = setInterval(async () => {
      const state = await player.getCurrentState();
      if (!state) return;
  
      setIsPlaying(!state.paused);
      setCurrentTime(state.position / 1000); // Convert ms to seconds
      setTrackDuration(state.duration / 1000); // Convert ms to seconds
    }, 1000); // Update every second
  
    return () => clearInterval(interval);
  }, [player, isPlaying]);
  

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

      const data = await response.json();
      if (data.tracks?.items) setSearchResults(data.tracks.items);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  const handlePlay = async (track: Track) => {
    if (!deviceId) return alert("No active Spotify player found.");

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [track.uri] }),
    });

    let artistId = null;
    //get the first artist ID of the track
    if (!artistId)
    {
      
        try {
          const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${track.id}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          //with artist id, get genres[] of artist
          if (trackResponse.ok) {
            const trackData = await trackResponse.json();
            artistId = trackData.artists[0]?.id || null;
            console.log("Artist ID: ", artistId);
            const genres = await getArtistGenres(artistId, token);
            console.log("Artist Genres:", genres);
            //ask AI to make a summary of the genres
            if (genres.length > 0)
            {
              run("@cf/meta/llama-3-8b-instruct", {
              messages: [
                { role: "system", content: "You are a friendly assistant" },
                { role: "user", content: `Generate an image influenced by the genres: ${genres.join(", ")}` },
              ],
              }).then((response) => {
                console.log("Run API Response:", JSON.stringify(response));
                //const aiText = JSON.stringify(response.response || "No AI summary available.");
                const aiText = response.result?.response || "No AI summary available.";
                setAiSummary(aiText);
              });
            }
          }
        } catch (error) {
          console.error("Error fetching track details:", error);
        }
    }
  };

  const handlePause = async () => {
    if (!deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const handleResume = async () => {
    if (!deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user?.display_name}!</h1>

      <div className="ai-summary-box">
        <h3>Ai Genre Summary</h3>
        <p>{aiSummary || "Play a song to see the genre summary!"}</p>
      </div>

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
              <button onClick={() => handlePlay(track)}>Play</button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Music Player */}
      {currentTrack && (
        <div className="player-bar">
          <div className="player-info">
            <img src={currentTrack.album.images[0]?.url} alt="Album Cover" className="player-album-cover" />
            <div className="player-song-details">
              <h3>{currentTrack.name}</h3>
              <p>{currentTrack.artists.map((artist) => artist.name).join(", ")}</p>
            </div>
          </div>

          <div className="player-controls">
            <button onClick={handlePreviousTrack} className="player-button">⏮️</button>
            {isPlaying ? <button onClick={handlePause} className="player-button">⏸️</button> : <button onClick={handleResume} className="player-button">▶️</button>}
            <button onClick={handleNextTrack} className="player-button">⏭️</button>
          </div>

          <div className="player-progress-container">
            {/* Current Time Display */}
            <span className="player-time">{formatTime(currentTime)}</span>

            {/* Progress Bar Wrapper */}
            <div className="player-progress-wrapper">
              {/* Green Progress Line */}
              <div
                className="player-progress-bar"
                style={{ width: `${(currentTime / trackDuration) * 100}%` }}
              ></div>

              {/* Progress Slider (Clickable) */}
              <input
                type="range"
                min="0"
                max={trackDuration}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="player-progress-slider"
              />
            </div>

            {/* Total Duration Display */}
            <span className="player-time">{formatTime(trackDuration)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
