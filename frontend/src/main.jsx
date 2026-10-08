import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { api, setToken, can } from "./api";
import { Login, Users } from "./Users.jsx";
import Finance from "./Finance.jsx";
import Charges from "./Charges.jsx";
// ⬇️ Votre interface bilingue (droguerie-app.jsx) adaptée à l'API -> AppUI.jsx
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
  const perms = session.permissions;
  // AppUI reçoit les pages supplémentaires à afficher selon les permissions :
  //  - Créances/Dettes  (finance.read)
  //  - Charges/Déplacements (expenses.read)
  //  - Utilisateurs (users.read)
  return <AppUI
    session={session} perms={perms}
    onLogout={() => { setToken(null); location.reload(); }}
    pages={{
      finance: can(perms, "finance.read") ? <Finance /> : null,
      charges: can(perms, "expenses.read") ? <Charges /> : null,
      users: can(perms, "users.read") ? <Users perms={perms} /> : null,
    }}
  />;
}
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
