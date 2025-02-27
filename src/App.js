// src/App.js

import React from "react";
import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard/Dashboard/Dashboard";

function App() {
  const token = window.location.hash.includes("access_token");

  return (
    <div className="App">
      {token ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;
