import React, { useEffect, useState, useRef } from "react";
import { fetchSpotifyData, fetchPlaylists, getArtistGenres, searchSpotifyTracks, run } from "../../spotify";
// import genreMappings from "../../music_genres.json";
import "../../index.css"; // Use global styles from src/index.css

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
const genreColorMap: { [key: string]: [string, string] } = {
  "pop": ["#FFD6D1", "#FFA7A6"], // Peach Pink
  "rock": ["#525150", "#474746"], // Dark Grey
  "jazz": ["#CAE9F5", "#AFDCEB"], // Light Blue
  "hip hop": ["#FFFFC5", "#FFEE8C"], // Light Yellow
  "classical": ["#FBF3E9", "#FAEEDA"], // Off White
  "electronic": ["#5f27cd", "#341f97"], // Purple to Dark Purple
  "metal": ["#d63031", "#c23616"], // Deep Red to Maroon
  "country": ["#FFD8B2", "#FFC78F"], // Light Orange
  // "blues": ["#0652DD", "#1B1464"], // Blue to Dark Blue
  // "reggae": ["#10ac84", "#0a3d62"], // Green to Dark Green
  // "folk": ["#8395a7", "#576574"], // Soft Blue to Grayish Blue
  // "indie": ["#f368e0", "#ff6b81"], // Pink to Red
  // "funk": ["#ff9f43", "#ff6b6b"], // Orange to Red
  // "soul": ["#ff6348", "#d63031"], // Deep Orange to Red
  "lo-fi": ["#6D5ACF", "#A092EA"], // Indigo
  "default": ["#B3C0A4", "#7A896F"], // Green
};


const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [user, setUser] = useState<User | null>(null);
  // const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [aiSummary, setAiSummary] = useState<string>("");
  // const [topAlbums, setTopAlbums] = useState<{ id: string; name: string; image: string }[]>([]);
  // const [topPlaylists, setTopPlaylists] = useState<Playlist[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

const toggleSearchResults = () => {
  setShowSearchResults((prev) => !prev);
};


  const [genreColor, setGenreColor] = useState<[string, string]>(genreColorMap.default);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // const findGenreCategory = (genre: string): string => {
  //   const normalizedGenre = genre.toLowerCase().replace(/[\s\/]+/g, " "); // Normalize spaces & slashes
  //   for (const [category, subgenres] of Object.entries(genreMappings)) {
  //     if (subgenres.map((sg) => sg.toLowerCase()).includes(normalizedGenre)) {
  //       return category;
  //     }
  //   }
  //   return "default"; // Return "default" if no match is found
  // };
  
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    let animationFrameId: number;
    let hueShift = 0;
    let transitionProgress = 0;
    //let baseColors: [string, string] = genreColorMap[genreColor] || genreColorMap.default;
  
    // ✅ Resize canvas dynamically
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
  
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
  
    // ✅ Convert HEX to HSL
    const hexToHSL = (hex: string) => {
      let r = parseInt(hex.substring(1, 3), 16) / 255;
      let g = parseInt(hex.substring(3, 5), 16) / 255;
      let b = parseInt(hex.substring(5, 7), 16) / 255;
  
      let max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      let h = 0,
        s = 0,
        l = (max + min) / 2;
  
      if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h *= 60;
      }
  
      return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
    };
  
    let baseColors: [string, string] = genreColor;
    let startColor = hexToHSL(baseColors[0]); // ✅ Now it works
    let endColor = hexToHSL(baseColors[1]);   // ✅ Now it works
  
    // ✅ Generate Moving Blobs
    const blobs = Array.from({ length: 5 }).map(() => {
      let radius = Math.random() * 150 + 80;
      
      // ✅ Ensure blobs do NOT spawn too close to the edges
      let x = Math.random() * (canvas.width - 2 * radius) + radius;
      let y = Math.random() * (canvas.height - 2 * radius) + radius;
      
      let dx = (Math.random() - 0.5) * 2;
      let dy = (Math.random() - 0.5) * 2;
    
      // ✅ Ensure blobs don’t start with zero movement
      if (Math.abs(dx) < 0.2) dx = dx > 0 ? 0.5 : -0.5;
      if (Math.abs(dy) < 0.2) dy = dy > 0 ? 0.5 : -0.5;
    
      return { x, y, radius, dx, dy };
    });
    
  
    const animateBackground = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hueShift += 0.3;
  
      // ✅ Ensure transition progress remains between 0 and 1
      transitionProgress = Math.min(transitionProgress + 0.02, 1);
  
      const interpolateColor = (start: { h: number; s: number; l: number }, end: { h: number; s: number; l: number }, progress: number) => {
        let h = start.h + (end.h - start.h) * progress;
        let s = start.s + (end.s - start.s) * progress;
        let l = start.l + (end.l - start.l) * progress;
        return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
      };
  
      let bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, interpolateColor(startColor, endColor, transitionProgress));
      bgGradient.addColorStop(1, interpolateColor(endColor, startColor, transitionProgress));
  
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // ✅ Moving blobs with genre colors
      blobs.forEach((blob) => {
        blob.x += blob.dx;
        blob.y += blob.dy;
      
        // Check if the blob hits the horizontal edges
        if (blob.x - blob.radius <= 0 || blob.x + blob.radius >= canvas.width) {
          blob.dx *= -1; // Reverse horizontal direction
          blob.x += blob.dx * 2; // ✅ Ensure movement continues
        }
        
        // Check if the blob hits the vertical edges
        if (blob.y - blob.radius <= 0 || blob.y + blob.radius >= canvas.height) {
          blob.dy *= -1; // Reverse vertical direction
          blob.y += blob.dy * 2; // ✅ Ensure movement continues
        }
      
        // ✅ Prevent Blobs from Getting Stuck in Corners
        if (
          (blob.x - blob.radius <= 0 || blob.x + blob.radius >= canvas.width) &&
          (blob.y - blob.radius <= 0 || blob.y + blob.radius >= canvas.height)
        ) {
          // Nudge the blob in a random direction
          blob.dx = (Math.random() - 0.5) * 2;
          blob.dy = (Math.random() - 0.5) * 2;
        }
      
        // Create a smooth gradient for each blob
        let blobGradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
        blobGradient.addColorStop(0, `hsl(${startColor.h}, ${startColor.s}%, ${Math.min(startColor.l + 10, 100)}%)`);
        blobGradient.addColorStop(1, `hsl(${endColor.h}, ${endColor.s}%, ${Math.max(endColor.l - 10, 0)}%)`);
      
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fillStyle = blobGradient;
        ctx.globalAlpha = 0.7;
        ctx.fill();
      });
      
      
  
      animationFrameId = requestAnimationFrame(animateBackground);
    };
  
    animateBackground();
  
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [genreColor]);
  
  // const updateGenreColor = async (artistId: string) => {
  //   try {
  //     const genres = await getArtistGenres(artistId, token);
  //     if (genres.length > 0) {
  //       const primaryGenre = findGenreCategory(genres[0]);
  //       setGenreColor(genreColorMap[primaryGenre] || genreColorMap.default);
  //     }
  //   } catch (error) {
  //     console.error("Error updating genre colors:", error);
  //   }
  // };
  

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
            if (genres.length > 0) {
              // ✅ Normalize genre names (convert to lowercase & replace spaces/slashes)
              //const normalizedGenres = genres.map((genre) => genre.toLowerCase().replace(/[\s\/]+/g, " "));
            
              // ✅ Find the first genre that exists in the color map
              const matchingGenre = genres.find((genre) => genreColorMap.hasOwnProperty(genre));
            
              // ✅ If found, use it; otherwise, fall back to default
              setGenreColor(matchingGenre ? genreColorMap[matchingGenre] : genreColorMap.default);
            }
            
            // const primaryGenre = genres[0] || "default";
            // setGenreColor(genreColorMap[primaryGenre] || genreColorMap.default);
            //updateGenreColor(artistId);


            if (genres.length > 0) {
              // run("@cf/meta/llama-3-8b-instruct", {
              //   messages: [
              //     { role: "system", content: "You are a friendly assistant" },
              //     { role: "user", content: `Write a 1-line summary about these music genres: ${genres.join(", ")}` },
              //   ],
              // }).then((response) => {
              //   const aiText = response.result?.response || "No AI summary available.";
              //   setAiSummary(aiText);
              // });
              return;
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

//   useEffect(() => {
//     const fetchTopTracks = async () => {
//       try {
//         const response = await fetch(
//           `https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term`,
//           {
//             method: "GET",
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
    
//         if (!response.ok) throw new Error(`Failed to fetch top tracks: ${response.statusText}`);
    
//         const data = await response.json();
//         console.log("🎵 Top Tracks Response:", data);
    
//         // Extract unique albums from the top tracks
//         const albums: { id: string; name: string; image: string }[] = data.items
//           .map((track: { album: { id: string; name: string; images: { url: string }[] } }) => ({
//             id: track.album.id,
//             name: track.album.name,
//             image: track.album.images[0]?.url || "",
//           }))
//           .filter(
//             (album: { id: string }, index: number, self: { id: string }[]) =>
//               self.findIndex((a) => a.id === album.id) === index
//           ) // Deduplicate albums
//           .slice(0, 8); // Limit to 8
    
//         setTopAlbums(albums);
//       } catch (error) {
//         console.error("🚨 Error fetching top albums:", error);
//       }
//     };
    
  
//     fetchTopTracks();
//   }, [token]);

// useEffect(() => {
//   const fetchUserPlaylists = async () => {
//     try {
//       const response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=8`, {
//         method: "GET",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) throw new Error(`Failed to fetch playlists: ${response.statusText}`);

//       const data = await response.json();
//       console.log("📂 User Playlists Response:", data);

//       setTopPlaylists(data.items);
//     } catch (error) {
//       console.error("🚨 Error fetching user playlists:", error);
//     }
//   };

//   fetchUserPlaylists();
// }, [token]);

useEffect(() => {
  const fetchUserData = async () => {
    try {
      const userData = await fetchSpotifyData(token);
      if (userData) {
        setUser(userData);  // Ensure user data is set
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  fetchUserData();
}, [token]);


  useEffect(() => {
    if (!player || !isPlaying) return;
  
    // Update progress every second while playing
    const interval = setInterval(async () => {
      const state = await player.getCurrentState();
      if (!state) return;
  
      setCurrentTime(state.position / 1000); // Convert ms to seconds
      setTrackDuration(state.duration / 1000); // Convert ms to seconds
    }, 1000); // Updates every second
  
    return () => clearInterval(interval); // Cleanup on unmount
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

  {/* 🔍 Search Section (Contains both Search Bar & Collapsible Results) */}
<div className="search-container">
  <div className="search-tab">
    <input
      type="text"
      placeholder="Search for a song..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <button onClick={handleSearch}>Search</button>
    <button onClick={toggleSearchResults} className="toggle-button">
      {showSearchResults ? "▲ Hide Results" : "▼ Show Results"}
    </button>
  </div>

  {/* 🔎 Search Results (Only Show if Expanded) */}
  {showSearchResults && (
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
  )}
</div>


  {/* 🎨 AI Summary Box */}
  {/*<div className="ai-summary-box">
    <h3>AI Genre Summary</h3>
    <p>{aiSummary || "Play a song to see the genre summary!"}</p>
  </div>*/}

  {/* Removed top playlists and albums. */}

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
