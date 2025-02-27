import React, { useEffect, useState } from "react";
import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import { getTokenFromUrl } from "./spotify";
import logo from "./assets/MedMusic-Logo.png"; // ✅ Keep your logo import

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const _token = getTokenFromUrl().access_token;
    if (_token) {
      setToken(_token);
      window.location.hash = ""; // Clear the URL to prevent token leakage
    }

    // ✅ Dynamically update the favicon
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
    <div className="App">
      {token ? <Dashboard token={token} /> : <Login />}
    </div>
  );
};

export default App;
