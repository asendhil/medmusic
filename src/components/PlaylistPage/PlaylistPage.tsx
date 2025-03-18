import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPlaylistTracks, getArtistGenres, run } from "../../spotify";
import { FaPlay, FaPause, FaForward, FaBackward, FaArrowLeft } from "react-icons/fa";
import "../../index.css";

interface Track {
  id: string;
  name: string;
  artists: string[];
  artistId: string | null;
  preview_url: string | null;
}

interface PlaylistPageProps {
  token: string | null;
}

const PlaylistPage: React.FC<PlaylistPageProps> = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = new Audio(); // Audio reference for playing tracks

  useEffect(() => {
    if (id && token) {
      fetchPlaylistTracks(id, token).then(setTracks);
    }
  }, [id, token]);

  

  // Play a track
  const handlePlay = async (track: Track) => {
    if (track.preview_url) {
      audioRef.src = track.preview_url;
      audioRef.play();
      setCurrentTrack(track);
      setIsPlaying(true);
      const artistId = track.artistId;
      if (artistId)
      {
        const fetchedGenres = await getArtistGenres(artistId, token);
        console.log("Artist Genres:", fetchedGenres);
        run("@cf/meta/llama-3-8b-instruct", {
          messages: [
            {
              role: "system",
              content: "You are a friendly assistant",
            },
            {
              role: "user",
              content: "Write a 1 line summary about rap",
            },
          ],
        }).then((response) => {
          console.log(JSON.stringify(response));
        });
      }

      
    } else {
      alert("No preview available for this track");
    }
  };

  // Pause the current track
  const handlePause = () => {
    audioRef.pause();
    setIsPlaying(false);
  };

  // Skip forward to the next track
  const handleForward = () => {
    const index = tracks.findIndex((t) => t.id === currentTrack?.id);
    console.log(index);
    if (index !== -1 && index < tracks.length - 1) {
      handlePlay(tracks[index + 1]);
    }
  };

  // Go back to the previous track
  const handleBackward = () => {
    const index = tracks.findIndex((t) => t.id === currentTrack?.id);
    if (index > 0) {
      handlePlay(tracks[index - 1]);
    }
  };

  return (
    <div className="playlist-page">
      <button className="back-button" onClick={() => navigate("/")}>
        <FaArrowLeft /> Back to Library
      </button>
      <h2>Playlist Songs</h2>
      <div className="track-list">
        {tracks.map((track) => (
          <div key={track.id} className="track-item">
            <span>{track.name} - {track.artists.join(", ")}</span>
            <button onClick={() => handlePlay(track)}><FaPlay /></button>
          </div>
        ))}
      </div>

      {/* Playback Controls */}
      {currentTrack && (
        <div className="player-controls">
          <button onClick={handleBackward}><FaBackward /></button>
          <button onClick={isPlaying ? handlePause : () => handlePlay(currentTrack)}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button onClick={handleForward}><FaForward /></button>
        </div>
      )}
    </div>
  );
};

export default PlaylistPage;
