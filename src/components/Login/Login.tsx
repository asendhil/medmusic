// src/components/Login/Login.tsx

import React from "react";
import { loginWithSpotify } from "../../spotify";
import "../../index.css"; // If using global styles

const Login: React.FC = () => {
  return (
    <div className="login-container">
      <h1 className="login-title">Welcome to MedMusic</h1>
      <button className="login-button" onClick={loginWithSpotify}>
        Login with Spotify
      </button>
    </div>
  );
};

export default Login;
