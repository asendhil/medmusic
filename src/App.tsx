// import React, { useEffect, useState } from "react";
// import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import Login from "./components/Login/Login";
// import Dashboard from "./components/Dashboard/Dashboard";
// import PlaylistPage from "./components/PlaylistPage/PlaylistPage";
// import { getTokenFromUrl } from "./spotify";
// import logo from "./assets/MedMusic-Logo.png";

// const App: React.FC = () => {
//   const [token, setToken] = useState<string | null>(null);

//   useEffect(() => {
//     // ✅ Use setTimeout to prevent race conditions
//     setTimeout(() => {
//       try {
//         const _token = getTokenFromUrl().access_token;
//         if (_token) {
//           setToken(_token);
//           window.location.hash = ""; // ✅ Clears token from URL to prevent leaks
//         }
//       } catch (error) {
//         console.error("Error parsing Spotify token:", error);
//       }
//     }, 500); // ✅ Slight delay for smoother redirects
//   }, []);

//   // ✅ Dynamically update the favicon
//   useEffect(() => {
//     const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
//     if (link) {
//       link.href = logo;
//     } else {
//       const newLink = document.createElement("link");
//       newLink.rel = "icon";
//       newLink.href = logo;
//       document.head.appendChild(newLink);
//     }
//   }, []);

//   return (
//     <Router>
//       <Routes>
//         {/* ✅ If user is logged in, show Dashboard, otherwise show Login */}
//         <Route path="/" element={token ? <Dashboard token={token} /> : <Login />} />
//         <Route path="/playlist/:id" element={<PlaylistPage token={token} />} />
//       </Routes>
//     </Router>
//   );
// };

// export default App;

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import PlaylistPage from "./components/PlaylistPage/PlaylistPage";
import { getTokenFromUrl } from "./spotify";
import logo from "./assets/MedMusic-Logo.png";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("spotify_access_token") // ✅ Persist token on refresh
  );

  useEffect(() => {
    // ✅ Extract token from URL after login
    setTimeout(() => {
      try {
        const _token = getTokenFromUrl().access_token;
        if (_token) {
          localStorage.setItem("spotify_access_token", _token); // ✅ Save it!
          setToken(_token);
          window.location.hash = ""; // ✅ Clears token from URL
        }
      } catch (error) {
        console.error("Error parsing Spotify token:", error);
      }
    }, 500); // ✅ Slight delay for smoother redirects
  }, []);

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
    <Router>
      <Routes>
        {/* ✅ If user is logged in, show Dashboard, otherwise show Login */}
        <Route path="/" element={token ? <Dashboard token={token} /> : <Login />} />
        <Route path="/playlist/:id" element={<PlaylistPage token={token} />} />
      </Routes>
    </Router>
  );
};

export default App;
