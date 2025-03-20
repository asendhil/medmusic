// src/components/Login/Login.tsx

import React from "react";
import { loginWithSpotify } from "../../spotify";
import "../../index.css"; 

const Login: React.FC = () => {
  return (
    <div className="login-container">
      <h1 className="login-title">Welcome to MedMusic</h1>
      <button className="login-button" onClick={loginWithSpotify}>
      <img 
          src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg" 
          alt="Spotify Logo" 
          className="spotify-logo" 
        />
        Login with Spotify
      </button>
    </div>
  );
};

export default Login;

