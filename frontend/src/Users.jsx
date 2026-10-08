import { useState, useEffect } from "react";
import { api, setToken, can } from "./api";

/* Écran de connexion ------------------------------------------------ */
export function Login({ onLogin }) {
  const [login, setLogin] = useState("admin");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const r = await api.login(login, password);
      setToken(r.token);
      onLogin(r);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen grid place-items-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <span className="bg-amber-500 text-slate-900 w-10 h-10 rounded-lg grid place-items-center font-bold">DP</span>
          <div><div className="font-bold text-lg">Droguerie<span className="text-amber-500">Pro</span></div><div className="text-xs text-slate-400">Connexion</div></div>
        </div>
        <label className="block mb-3"><span className="text-xs text-slate-500">Identifiant</span>
          <input value={login} onChange={(e) => setLogin(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" /></label>
        <label className="block mb-4"><span className="text-xs text-slate-500">Mot de passe</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} className="w-full border rounded-lg px-3 py-2 mt-1" /></label>
        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
        <button onClick={submit} disabled={busy} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2.5 rounded-lg disabled:opacity-50">{busy ? "…" : "Se connecter"}</button>
        <p className="text-[11px] text-slate-400 mt-4 text-center">Par défaut : admin / admin123 (à changer)</p>
      </div>
    </div>
  );
}

/* Gestion des utilisateurs & profils -------------------------------- */
const PERM_GROUPS = {
  "Tableau de bord": ["dashboard.read"],
  "Produits / Stock": ["products.read", "products.write"],
  "Ventes": ["sales.read", "sales.write", "sales.advance", "sales.pay", "sales.delete"],
  "Achats": ["purchases.read", "purchases.write", "purchases.advance", "purchases.pay", "purchases.delete"],
  "Clients": ["clients.read", "clients.write"],
  "Fournisseurs": ["suppliers.read", "suppliers.write"],
  "Paramètres": ["settings.read", "settings.write"],
  "Utilisateurs": ["users.read", "users.write"],
};

export function Users({ perms }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editRole, setEditRole] = useState(null);
  const load = async () => { setUsers(await api.users()); setRoles(await api.roles()); };
  useEffect(() => { load(); }, []);
  const writable = can(perms, "users.write");

  const saveUser = async (u) => { await api.saveUser(u); setEditing(null); load(); };
  const delUser = async (id) => { if (confirm("Supprimer cet utilisateur ?")) { await api.deleteUser(id); load(); } };
  const saveRole = async (r) => { await api.saveUser; await fetch; }; // placeholder (roles handled below)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Utilisateurs & Profils</h1>
        {writable && <button onClick={() => setEditing({ role_id: roles[0]?.id })} className="bg-amber-500 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm">+ Nouvel utilisateur</button>}
      </div>

      <h2 className="font-semibold text-slate-600 mb-2 text-sm">Comptes</h2>
      <div className="bg-white rounded-xl border overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr><th className="text-left px-4 py-3">Nom</th><th className="text-left px-4 py-3">Identifiant</th><th className="text-left px-4 py-3">Profil</th><th className="text-center px-4 py-3">Actif</th><th></th></tr></thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{u.nom}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{u.login}</td>
                <td className="px-4 py-3">{u.role_nom}</td>
                <td className="px-4 py-3 text-center">{u.actif ? "✅" : "⛔"}</td>
                <td className="px-4 py-3 text-right">{writable && <><button onClick={() => setEditing(u)} className="text-amber-600 text-xs px-2">Modifier</button><button onClick={() => delUser(u.id)} className="text-red-600 text-xs px-2">Suppr.</button></>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-semibold text-slate-600 mb-2 text-sm">Profils & autorisations</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {roles.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">{r.nom} {r.systeme && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">système</span>}</div>
              {writable && <button onClick={() => setEditRole(r)} className="text-amber-600 text-xs">Autorisations</button>}
            </div>
            <div className="text-xs text-slate-500">
              {r.permissions["*"] ? "Accès total (toutes permissions)" : Object.keys(r.permissions).filter((k) => r.permissions[k]).length + " autorisations"}
            </div>
          </div>
        ))}
      </div>

      {editing && <UserModal user={editing} roles={roles} onSave={saveUser} onClose={() => setEditing(null)} />}
      {editRole && <RoleModal role={editRole} onSaved={() => { setEditRole(null); load(); }} onClose={() => setEditRole(null)} />}
    </div>
  );
}

function UserModal({ user, roles, onSave, onClose }) {
  const [f, setF] = useState({ nom: "", login: "", email: "", password: "", actif: 1, ...user });
  const up = (k, v) => setF({ ...f, [k]: v });
  return (
    <Modal title={user.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <L label="Nom"><input value={f.nom || ""} onChange={(e) => up("nom", e.target.value)} className={I} /></L>
        <L label="Identifiant"><input value={f.login || ""} onChange={(e) => up("login", e.target.value)} disabled={!!user.id} className={I} /></L>
        <L label="Email"><input value={f.email || ""} onChange={(e) => up("email", e.target.value)} className={I} /></L>
        <L label="Profil"><select value={f.role_id} onChange={(e) => up("role_id", e.target.value)} className={I}>{roles.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}</select></L>
        <L label={user.id ? "Nouveau mot de passe (option.)" : "Mot de passe"}><input type="password" value={f.password || ""} onChange={(e) => up("password", e.target.value)} className={I} /></L>
        <L label="Actif"><select value={f.actif} onChange={(e) => up("actif", +e.target.value)} className={I}><option value={1}>Oui</option><option value={0}>Non</option></select></L>
      </div>
      <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="text-slate-500 px-4 py-2 text-sm">Annuler</button><button onClick={() => onSave(f)} className="bg-amber-500 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm">Enregistrer</button></div>
    </Modal>
  );
}

function RoleModal({ role, onSaved, onClose }) {
  const [perms, setPerms] = useState({ ...role.permissions });
  const [nom, setNom] = useState(role.nom);
  const toggle = (k) => setPerms({ ...perms, [k]: !perms[k] });
  const save = async () => {
    await fetch((import.meta.env.VITE_API_URL || "http://localhost:4000/api") + "/roles/" + role.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("dp_token") },
      body: JSON.stringify({ nom, permissions: perms }),
    });
    onSaved();
  };
  const full = perms["*"];
  return (
    <Modal title={"Autorisations — " + role.nom} onClose={onClose} wide>
      {full ? <p className="text-sm text-slate-500 mb-4">Ce profil dispose de l'accès total. (Administrateur)</p> : (
        <div className="grid sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto">
          {Object.entries(PERM_GROUPS).map(([grp, keys]) => (
            <div key={grp} className="border rounded-lg p-3">
              <div className="font-semibold text-sm mb-2">{grp}</div>
              {keys.map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm py-1">
                  <input type="checkbox" checked={!!perms[k]} onChange={() => toggle(k)} />
                  <span className="text-slate-600">{k.split(".")[1]}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
      {!full && <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="text-slate-500 px-4 py-2 text-sm">Annuler</button><button onClick={save} className="bg-amber-500 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm">Enregistrer</button></div>}
    </Modal>
  );
}

const I = "w-full border rounded-lg px-3 py-2 text-sm mt-1";
const L = ({ label, children }) => <label className="block"><span className="text-xs text-slate-500">{label}</span>{children}</label>;
function Modal({ title, onClose, children, wide }) {
  return <div className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/50 p-4 overflow-y-auto"><div className={`bg-white rounded-xl w-full ${wide ? "max-w-2xl" : "max-w-md"} my-8 p-5`}><div className="flex justify-between mb-4"><h3 className="font-semibold">{title}</h3><button onClick={onClose}>✕</button></div>{children}</div></div>;
}
