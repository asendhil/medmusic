// src/App.tsx

import React, { useEffect, useState } from "react";
import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import { getTokenFromUrl } from "./spotify";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const _token = getTokenFromUrl().access_token;
    if (_token) {
      setToken(_token);
      window.location.hash = ""; // Clear the URL to prevent token leakage
    }
  }, []);

  return (
    <div className="App">
      {token ? <Dashboard token={token} /> : <Login />}
    </div>
  );
};

export default App;
