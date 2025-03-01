import React, { useEffect, useState } from "react";
import { fetchSpotifyData, fetchPlaylists } from "../../spotify";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
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

const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeTab, setActiveTab] = useState<"library" | "search">("library");
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    fetchSpotifyData(token).then(setUser);
    fetchPlaylists(token).then(setPlaylists);
  }, [token]);

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user?.display_name}!</h1>

      {/* Tab Navigation */}
      <div className="tab-menu">
        <button
          className={activeTab === "library" ? "active-tab" : ""}
          onClick={() => setActiveTab("library")}
        >
          Your Library
        </button>
        <button
          className={activeTab === "search" ? "active-tab" : ""}
          onClick={() => setActiveTab("search")}
        >
          Search
        </button>
      </div>

      {/* Render Playlists */}
      {activeTab === "library" ? (
        <div className="library-tab">
          <h2>Your Playlists</h2>
          <div className="playlist-list">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="playlist-item"
                onClick={() => navigate(`/playlist/${playlist.id}`)} // Navigate to playlist page
              >
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
          <h2>Search</h2>
          <input type="text" placeholder="Search for a song or artist..." />
          <button>Search</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
