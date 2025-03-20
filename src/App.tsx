import React, { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom"; 
import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import PlaylistPage from "./components/PlaylistPage/PlaylistPage";
import logo from "./assets/MedMusic-Logo.png";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Extract token from the URL after login
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?")); // Convert hash to query format
    const _token = params.get("access_token");

    if (_token) {
      setToken(_token);
      localStorage.setItem("spotifyToken", _token); // ✅ Save token for persistence
      window.location.hash = ""; // ✅ Clear the URL

      // ✅ Manually change the hash to navigate (since we cannot use useNavigate)
      //window.location.hash = "/";
      if (_token && !window.location.hash.includes("/")) {
        window.location.hash = "/"; // ✅ Redirect only if necessary
      }
      
    }
  }, []);

  useEffect(() => {
    // ✅ Load token from local storage on refresh
    const storedToken = localStorage.getItem("spotifyToken");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // ✅ Dynamically update the favicon
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = logo;
    } else {
      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.href = logo;
      document.head.appendChild(newLink);
    }
  }, []);

  return (
    <HashRouter>
      <Routes>
        {/* ✅ If user is logged in, show Dashboard; otherwise, show Login */}
        <Route path="/" element={token ? <Dashboard token={token} /> : <Login />} />
        <Route path="/playlist/:id" element={<PlaylistPage token={token} />} />
        
        {/* ✅ Handle the blank callback page after login */}
        <Route path="/callback" element={<div>Loading...</div>} />
        <Route path="/callback" element={<h2>Authenticating...</h2>} />

      </Routes>
    </HashRouter>
  );
};

export default App;
