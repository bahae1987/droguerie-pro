import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { api, setToken } from "./api";
import { Login } from "./Users.jsx";
import AppUI from "./AppUI.jsx";

function Root() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { (async () => {
    if (localStorage.getItem("dp_token")) { try { setSession(await api.me()); } catch { setToken(null); } }
    setReady(true);
  })(); }, []);
  if (!ready) return null;
  if (!session) return <Login onLogin={setSession} />;
  return <AppUI session={session} onLogout={() => { setToken(null); location.reload(); }} />;
}
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
