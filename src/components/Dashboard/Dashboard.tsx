import React, { useEffect, useState } from "react";
import { fetchSpotifyData, fetchPlaylists, searchSpotifyTracks } from "../../spotify";
import { useNavigate } from "react-router-dom";
import { FaPlay } from "react-icons/fa";
import "../../index.css";

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
  artists: string[];
  preview_url: string | null;
  albumCover: string;
}

const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState<"library" | "search">("library");
  const navigate = useNavigate();
  const audioRef = new Audio(); // Audio reference for playing tracks

  useEffect(() => {
    fetchSpotifyData(token).then(setUser);
    fetchPlaylists(token).then(setPlaylists);
  }, [token]);

  // Handle Search Input
  const handleSearch = async () => {
    if (searchTerm.trim() === "") return;
    const results = await searchSpotifyTracks(searchTerm, token);
    setSearchResults(results);
  };

  // Play a track from search results
  const handlePlay = (track: Track) => {
    if (track.preview_url) {
      const audio = new Audio(track.preview_url);
      audio.play();
    } else {
      alert(`No preview available for "${track.name}" by ${track.artists.join(", ")}`);
    }
  };
  

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user?.display_name}!</h1>

      {/* Tab Navigation */}
      <div className="tab-menu">
        <button className={activeTab === "library" ? "active-tab" : ""} onClick={() => setActiveTab("library")}>
          Your Library
        </button>
        <button className={activeTab === "search" ? "active-tab" : ""} onClick={() => setActiveTab("search")}>
          Search
        </button>
      </div>

      {/* Render Active Tab Content */}
      {activeTab === "library" ? (
        <div className="library-tab">
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
        </div>
      ) : (
        <div className="search-tab">
          <h2>Search for Songs</h2>
          <input
            type="text"
            placeholder="Search for a song or artist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>

          {/* Display Search Results */}
          <div className="search-results">
            {searchResults.map((track) => (
              <div key={track.id} className="search-item">
                <img src={track.albumCover} alt="Album Cover" className="search-cover" />
                <div className="search-info">
                  <h3>{track.name}</h3>
                  <p>{track.artists.join(", ")}</p>
                </div>
                {/* <button onClick={() => handlePlay(track)}><FaPlay /></button> */}
                {track.preview_url ? (
                  <button onClick={() => handlePlay(track)}><FaPlay /></button>
                ) : (
                  <a href={`https://open.spotify.com/track/${track.id}`} target="_blank" rel="noopener noreferrer">
                    Open on Spotify
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
