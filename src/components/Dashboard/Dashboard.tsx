// src/components/Dashboard/Dashboard.tsx

import React, { useEffect, useState } from "react";
import { fetchSpotifyData, fetchPlaylists } from "../../spotify";

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

  useEffect(() => {
    fetchSpotifyData(token).then(setUser);
    fetchPlaylists(token).then(setPlaylists);
  }, [token]);

  return (
    <div>
      {user ? (
        <>
          <h1>Welcome, {user.display_name}!</h1>
          <h2>Your Playlists</h2>
          <div>
            {playlists.map((playlist) => (
              <div key={playlist.id}>
                <h3>{playlist.name}</h3>
                <img src={playlist.images[0]?.url} alt="Playlist Cover" width="100" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <h1>Loading...</h1>
      )}
    </div>
  );
};

export default Dashboard;
