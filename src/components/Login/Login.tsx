// src/components/Login.tsx

import React from "react";
import { loginWithSpotify } from "../../spotify";

const Login: React.FC = () => {
  return (
    <div>
      <h1>Welcome to My React Spotify App</h1>
      <button onClick={loginWithSpotify}>Login with Spotify</button>
    </div>
  );
};

export default Login;
