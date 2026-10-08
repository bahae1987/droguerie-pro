import { useState, useEffect } from "react";
import { api, can } from "./api";
import Attachments from "./Attachments.jsx";
import Finance from "./Finance.jsx";
import Charges from "./Charges.jsx";
import { Users } from "./Users.jsx";

/* ============================ Utilitaires ============================ */
const dh = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DH";
const today = () => new Date().toISOString().slice(0, 10);
const reste = (inv) => inv.reglement ? inv.reglement.reste : 0;
const stat = (inv) => inv.reglement ? inv.reglement.statut : "—";

const I = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100";
const BTN = "flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm";
const BTN2 = "bg-white border border-slate-300 hover:border-amber-400 text-slate-700 font-medium px-3 py-1.5 rounded-lg text-sm";

function Field({ label, children }) { return <label className="block"><span className="text-xs font-medium text-slate-500 mb-1 block">{label}</span>{children}</label>; }
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} my-8`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200"><h3 className="font-semibold text-slate-800">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button></div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function Badge({ children, tone = "slate" }) {
  const t = { slate: "bg-slate-100 text-slate-600", green: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700", red: "bg-red-100 text-red-600", blue: "bg-sky-100 text-sky-700" };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full ${t[tone]}`}>{children}</span>;
}
const statutTone = (s) => s === "complet" ? "green" : s === "partiel" ? "amber" : "blue";
const payTone = (s) => s === "réglée" ? "green" : s === "partielle" ? "amber" : "red";

/* Sélecteur de lignes produit (commandes) */
function LineEditor({ products, lignes, setLignes, priceField }) {
  const [pick, setPick] = useState(""); const [qte, setQte] = useState(1);
  const add = () => { const p = products.find((x) => x.id === pick); if (!p || qte < 1) return;
    const ex = lignes.find((l) => l.produit_id === p.id);
    if (ex) setLignes(lignes.map((l) => l.produit_id === p.id ? { ...l, qte: l.qte + qte } : l));
    else setLignes([...lignes, { produit_id: p.id, ref: p.ref, nom: p.nom, prix_unit: p[priceField], qte }]);
    setPick(""); setQte(1); };
  return (
    <>
      <div className="flex gap-2 items-end mb-2">
        <div className="flex-1"><Field label="Produit"><select value={pick} onChange={(e) => setPick(e.target.value)} className={I}><option value="">— Choisir —</option>{products.map((p) => <option key={p.id} value={p.id}>{p.nom} · {dh(p[priceField])}</option>)}</select></Field></div>
        <div className="w-20"><Field label="Qté"><input type="number" min={1} value={qte} onChange={(e) => setQte(+e.target.value)} className={I} /></Field></div>
        <button onClick={add} className="bg-slate-800 text-white px-3 rounded-lg h-[38px]">+</button>
      </div>
      <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-3 py-2">Désignation</th><th className="text-right px-3 py-2 w-24">P.U.</th><th className="text-center px-3 py-2 w-16">Qté</th><th className="text-right px-3 py-2 w-24">Total</th><th></th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {lignes.map((l) => <tr key={l.produit_id}><td className="px-3 py-2">{l.nom}</td><td className="px-3 py-1"><input type="number" value={l.prix_unit} onChange={(e) => setLignes(lignes.map((x) => x.produit_id === l.produit_id ? { ...x, prix_unit: +e.target.value } : x))} className="w-full text-right border rounded px-1 py-0.5 text-xs" /></td><td className="px-3 py-1"><input type="number" value={l.qte} onChange={(e) => setLignes(lignes.map((x) => x.produit_id === l.produit_id ? { ...x, qte: +e.target.value } : x))} className="w-full text-center border rounded px-1 py-0.5 text-xs" /></td><td className="px-3 py-2 text-right font-mono">{dh(l.prix_unit * l.qte)}</td><td className="px-2"><button onClick={() => setLignes(lignes.filter((x) => x.produit_id !== l.produit_id))} className="text-slate-300 hover:text-red-500">×</button></td></tr>)}
          {lignes.length === 0 && <tr><td colSpan={5} className="text-center py-5 text-slate-400">Aucune ligne.</td></tr>}
        </tbody>
      </table>
    </>
  );
}

/* Sélecteur de lignes EN ATTENTE (réception/livraison/facturation partielles) */
function PendingPicker({ rows, sel, setSel, editablePrice }) {
  const setQ = (id, q) => setSel({ ...sel, [id]: { ...(sel[id] || {}), qte: q } });
  const setP = (id, p) => setSel({ ...sel, [id]: { ...(sel[id] || {}), prix_unit: p } });
  return (
    <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
      <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-3 py-2">Pièce</th><th className="text-left px-3 py-2">Produit</th><th className="text-right px-3 py-2">Reste</th>{editablePrice && <th className="text-right px-3 py-2 w-24">P.U.</th>}<th className="text-center px-3 py-2 w-24">À traiter</th></tr></thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => <tr key={r.id}>
          <td className="px-3 py-2 font-mono text-xs text-slate-500">{r.num_commande}</td>
          <td className="px-3 py-2">{r.nom}</td>
          <td className="px-3 py-2 text-right font-mono">{r.reste}</td>
          {editablePrice && <td className="px-3 py-1"><input type="number" defaultValue={r.prix_unit} onChange={(e) => setP(r.id, +e.target.value)} className="w-full text-right border rounded px-1 py-0.5 text-xs" /></td>}
          <td className="px-3 py-1"><input type="number" min={0} max={undefined} placeholder="0" value={sel[r.id]?.qte ?? ""} onChange={(e) => setQ(r.id, +e.target.value)} className="w-full text-center border rounded px-1 py-0.5 text-xs" /></td>
        </tr>)}
        {rows.length === 0 && <tr><td colSpan={editablePrice ? 5 : 4} className="text-center py-5 text-slate-400">Rien en attente.</td></tr>}
      </tbody>
    </table>
  );
}

/* ============================ Application ============================ */
export default function AppUI({ session, onLogout }) {
  const perms = session.permissions;
  const [view, setView] = useState("dashboard");
  const nav = [
    ["dashboard", "Tableau de bord", "dashboard.read"],
    ["products", "Stock & Produits", "products.read"],
    ["sales", "Ventes", "sales.read"],
    ["purchases", "Achats", "purchases.read"],
    ["finance", "Créances & Dettes", "finance.read"],
    ["charges", "Charges & Déplacements", "expenses.read"],
    ["clients", "Clients", "clients.read"],
    ["suppliers", "Fournisseurs", "suppliers.read"],
    ["users", "Utilisateurs", "users.read"],
    ["settings", "Paramètres", "settings.read"],
  ].filter(([, , p]) => can(perms, p) || p === "settings.read");

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">
      <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen">
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-2">
          <span className="bg-amber-500 text-slate-900 w-9 h-9 rounded-lg grid place-items-center font-bold">DP</span>
          <div><div className="font-bold text-white">Droguerie<span className="text-amber-500">Pro</span></div><div className="text-[11px] text-slate-500">{session.user.nom} · {session.user.role}</div></div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(([id, label]) => <button key={id} onClick={() => setView(id)} className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${view === id ? "bg-amber-500 text-slate-900 font-semibold" : "hover:bg-slate-800"}`}>{label}</button>)}
        </nav>
        <button onClick={onLogout} className="m-3 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-left">Déconnexion</button>
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {view === "dashboard" && <Dashboard />}
        {view === "products" && <Products perms={perms} />}
        {view === "sales" && <Sales perms={perms} />}
        {view === "purchases" && <Purchases perms={perms} />}
        {view === "finance" && <Finance />}
        {view === "charges" && <Charges />}
        {view === "clients" && <Parties kind="client" perms={perms} />}
        {view === "suppliers" && <Parties kind="supplier" perms={perms} />}
        {view === "users" && <Users perms={perms} />}
        {view === "settings" && <Settings perms={perms} />}
      </main>
    </div>
  );
}

/* ----------------------------- Dashboard ----------------------------- */
function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.dashboard().then(setD).catch(() => {}); }, []);
  if (!d) return <div className="p-6 text-slate-400">Chargement…</div>;
  const Card = ({ label, value, tone, sub }) => <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">{label}</div><div className="text-2xl font-bold font-mono mt-1" style={{ color: tone }}>{value}</div>{sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}</div>;
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card label="CA facturé (mois)" value={dh(d.caMonth)} tone="#059669" />
        <Card label="Ventes aujourd'hui" value={dh(d.caToday)} tone="#d97706" />
        <Card label="Valeur du stock" value={dh(d.stockValue)} />
        <Card label="Charges (mois)" value={dh(d.chargesMonth)} tone="#dc2626" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card label="Créances clients" value={dh(d.creances)} tone={d.creances ? "#dc2626" : undefined} sub="à encaisser" />
        <Card label="Dettes fournisseurs" value={dh(d.dettes)} tone={d.dettes ? "#dc2626" : undefined} sub="à régler" />
        <Card label="Alertes stock" value={d.alertes.length} tone={d.alertes.length ? "#dc2626" : undefined} />
        <Card label="Péremptions ≤30j" value={d.peremptions.length} tone={d.peremptions.length ? "#dc2626" : undefined} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><h3 className="font-semibold text-sm mb-3">Alertes de stock</h3>{d.alertes.length === 0 ? <p className="text-sm text-slate-400">Aucune.</p> : <ul className="space-y-1">{d.alertes.slice(0, 8).map((a) => <li key={a.id} className="flex justify-between text-sm"><span className="truncate pr-2">{a.nom}</span><span className="font-mono text-red-600">{a.quantite}/{a.stock_min}</span></li>)}</ul>}</div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><h3 className="font-semibold text-sm mb-3">Produits proches péremption</h3>{d.peremptions.length === 0 ? <p className="text-sm text-slate-400">Aucun.</p> : <ul className="space-y-1">{d.peremptions.map((p) => <li key={p.id} className="flex justify-between text-sm"><span className="truncate pr-2">{p.nom}</span><span className="font-mono text-red-600">{p.jours_restants}j</span></li>)}</ul>}</div>
      </div>
    </div>
  );
}

/* ----------------------------- Produits ----------------------------- */
function Products({ perms }) {
  const [list, setList] = useState([]); const [q, setQ] = useState(""); const [edit, setEdit] = useState(null); const [att, setAtt] = useState(null);
  const load = () => api.products().then(setList);
  useEffect(() => { load(); }, []);
  const filtered = list.filter((p) => !q || (p.nom + p.ref + (p.nom_ar || "")).toLowerCase().includes(q.toLowerCase()));
  const save = async (p) => { await api.saveProduct(p); setEdit(null); load(); };
  const del = async (id) => { if (confirm("Supprimer ?")) { await api.deleteProduct(id); load(); } };
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold">Stock & Produits <span className="text-sm font-normal text-slate-400">({list.length})</span></h1>{can(perms, "products.write") && <button onClick={() => setEdit({})} className={BTN}>+ Produit</button>}</div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (nom, réf, arabe)…" className={I + " mb-4 max-w-md"} />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-4 py-3">Réf</th><th className="text-left px-4 py-3">Désignation</th><th className="text-right px-4 py-3">Achat</th><th className="text-right px-4 py-3">Vente</th><th className="text-center px-4 py-3">Stock</th><th className="text-left px-4 py-3">Péremption</th><th></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => { const low = p.quantite <= p.stock_min; return <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.ref}</td>
              <td className="px-4 py-3 font-medium">{p.nom}{p.nom_ar && <span className="text-slate-400 font-normal"> · {p.nom_ar}</span>}</td>
              <td className="px-4 py-3 text-right font-mono text-slate-500">{dh(p.prix_achat)}</td>
              <td className="px-4 py-3 text-right font-mono">{dh(p.prix_vente)}</td>
              <td className="px-4 py-3 text-center"><Badge tone={low ? "red" : "green"}>{p.quantite}</Badge></td>
              <td className="px-4 py-3 text-xs text-slate-500">{p.date_expiration || "—"}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button onClick={() => setAtt(p)} className="text-slate-400 hover:text-sky-600 px-1" title="Pièces jointes">📎</button>
                {can(perms, "products.write") && <><button onClick={() => setEdit(p)} className="text-amber-600 text-xs px-1">Modifier</button><button onClick={() => del(p.id)} className="text-red-600 text-xs px-1">Suppr.</button></>}
              </td>
            </tr>; })}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">Aucun produit.</td></tr>}
          </tbody>
        </table>
      </div>
      {edit && <ProductModal product={edit} onSave={save} onClose={() => setEdit(null)} />}
      {att && <Modal title={"Pièces jointes — " + att.nom} onClose={() => setAtt(null)}><Attachments entityType="product" entityId={att.id} compact /></Modal>}
    </div>
  );
}
function ProductModal({ product, onSave, onClose }) {
  const [f, setF] = useState({ ref: "", nom: "", nom_ar: "", categorie: "", unite: "Pièce", prix_achat: 0, prix_vente: 0, quantite: 0, stock_min: 0, date_expiration: "", ...product });
  const up = (k, v) => setF({ ...f, [k]: v });
  return (
    <Modal title={product.id ? "Modifier le produit" : "Nouveau produit"} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Référence"><input value={f.ref || ""} onChange={(e) => up("ref", e.target.value)} className={I} /></Field>
        <Field label="Unité"><input value={f.unite || ""} onChange={(e) => up("unite", e.target.value)} className={I} /></Field>
        <Field label="Désignation"><input value={f.nom || ""} onChange={(e) => up("nom", e.target.value)} className={I} /></Field>
        <Field label="Désignation (arabe)"><input dir="rtl" value={f.nom_ar || ""} onChange={(e) => up("nom_ar", e.target.value)} className={I} /></Field>
        <Field label="Catégorie"><input value={f.categorie || ""} onChange={(e) => up("categorie", e.target.value)} className={I} /></Field>
        <Field label="Date de péremption"><input type="date" value={f.date_expiration || ""} onChange={(e) => up("date_expiration", e.target.value)} className={I} /></Field>
        <Field label="Prix d'achat"><input type="number" value={f.prix_achat} onChange={(e) => up("prix_achat", +e.target.value)} className={I} /></Field>
        <Field label="Prix de vente"><input type="number" value={f.prix_vente} onChange={(e) => up("prix_vente", +e.target.value)} className={I} /></Field>
        <Field label="Stock"><input type="number" value={f.quantite} onChange={(e) => up("quantite", +e.target.value)} className={I} /></Field>
        <Field label="Seuil d'alerte"><input type="number" value={f.stock_min} onChange={(e) => up("stock_min", +e.target.value)} className={I} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="text-slate-500 px-4 py-2 text-sm">Annuler</button><button onClick={() => f.nom ? onSave(f) : alert("Nom requis")} className={BTN}>Enregistrer</button></div>
    </Modal>
  );
}

/* --------------------- Clients / Fournisseurs ---------------------- */
function Parties({ kind, perms }) {
  const isC = kind === "client";
  const [list, setList] = useState([]); const [edit, setEdit] = useState(null); const [att, setAtt] = useState(null);
  const load = () => (isC ? api.clients() : api.suppliers()).then(setList);
  useEffect(() => { load(); }, [kind]);
  const save = async (x) => { await (isC ? api.saveClient(x) : api.saveSupplier(x)); setEdit(null); load(); };
  const del = async (id) => { if (confirm("Supprimer ?")) { await (isC ? api.deleteClient(id) : api.deleteSupplier(id)); load(); } };
  const wp = isC ? "clients.write" : "suppliers.write";
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold">{isC ? "Clients" : "Fournisseurs"} <span className="text-sm font-normal text-slate-400">({list.length})</span></h1>{can(perms, wp) && <button onClick={() => setEdit({})} className={BTN}>+ {isC ? "Client" : "Fournisseur"}</button>}</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((x) => <div key={x.id} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex justify-between"><div className="font-semibold">{x.nom}</div><div className="flex gap-1">{can(perms, wp) && <><button onClick={() => setEdit(x)} className="text-amber-600 text-xs">✎</button><button onClick={() => del(x.id)} className="text-red-600 text-xs">🗑</button></>}</div></div>
          <div className="mt-2 space-y-0.5 text-xs text-slate-500">{x.ice && <div>ICE : {x.ice}</div>}{x.tel && <div>{x.tel}</div>}{x.ville && <div>{x.ville}</div>}{isC && x.solde_du > 0 && <div className="text-red-600 font-medium">Solde dû : {dh(x.solde_du)}</div>}</div>
          <button onClick={() => setAtt(x)} className="mt-2 text-xs text-sky-600">📎 Pièces jointes</button>
        </div>)}
        {list.length === 0 && <p className="text-slate-400 text-sm">Aucune fiche.</p>}
      </div>
      {edit && <PartyModal kind={kind} entity={edit} onSave={save} onClose={() => setEdit(null)} />}
      {att && <Modal title={"Pièces jointes — " + att.nom} onClose={() => setAtt(null)}><Attachments entityType={kind} entityId={att.id} compact /></Modal>}
    </div>
  );
}
function PartyModal({ kind, entity, onSave, onClose }) {
  const isC = kind === "client";
  const [f, setF] = useState({ nom: "", ice: "", tel: "", ville: "", adresse: "", type: "particulier", contact: "", ...entity });
  const up = (k, v) => setF({ ...f, [k]: v });
  return (
    <Modal title={entity.id ? "Modifier" : (isC ? "Nouveau client" : "Nouveau fournisseur")} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Nom / Raison sociale"><input value={f.nom || ""} onChange={(e) => up("nom", e.target.value)} className={I} /></Field></div>
        {isC ? <Field label="Type"><select value={f.type} onChange={(e) => up("type", e.target.value)} className={I}><option value="particulier">Particulier</option><option value="entreprise">Entreprise</option></select></Field>
          : <Field label="Contact"><input value={f.contact || ""} onChange={(e) => up("contact", e.target.value)} className={I} /></Field>}
        <Field label="ICE"><input value={f.ice || ""} onChange={(e) => up("ice", e.target.value)} className={I} /></Field>
        <Field label="Téléphone"><input value={f.tel || ""} onChange={(e) => up("tel", e.target.value)} className={I} /></Field>
        <Field label="Ville"><input value={f.ville || ""} onChange={(e) => up("ville", e.target.value)} className={I} /></Field>
        {isC && <div className="col-span-2"><Field label="Adresse"><input value={f.adresse || ""} onChange={(e) => up("adresse", e.target.value)} className={I} /></Field></div>}
      </div>
      <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="text-slate-500 px-4 py-2 text-sm">Annuler</button><button onClick={() => f.nom ? onSave(f) : alert("Nom requis")} className={BTN}>Enregistrer</button></div>
    </Modal>
  );
}

/* ------------------------------- Ventes ------------------------------ */
function Sales({ perms }) {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]); const [invoices, setInvoices] = useState([]); const [deliveries, setDeliveries] = useState([]);
  const [clients, setClients] = useState([]); const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null); // {type, data}
  const load = async () => { setOrders(await api.salesOrders()); setInvoices(await api.customerInvoices()); setDeliveries(await api.deliveries()); };
  useEffect(() => { load(); api.clients().then(setClients); api.products().then(setProducts); }, []);
  const refresh = () => { load(); setModal(null); };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Ventes</h1>
        {can(perms, "sales.write") && <div className="flex gap-2">
          <button onClick={() => setModal({ type: "order" })} className={BTN2}>+ Devis/Commande</button>
          <button onClick={() => setModal({ type: "direct" })} className={BTN}>Vente directe</button>
        </div>}
      </div>
      <div className="flex gap-1 mb-4">{[["orders", "Commandes/Devis"], ["deliveries", "Livraisons"], ["invoices", "Factures"]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`text-sm px-3 py-1.5 rounded-lg ${tab === k ? "bg-slate-800 text-white" : BTN2}`}>{l}</button>)}</div>

      {tab === "orders" && <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-4 py-3">Pièce</th><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Client</th><th className="text-right px-4 py-3">Total TTC</th><th className="text-center px-4 py-3">Statut</th><th></th></tr></thead>
        <tbody className="divide-y divide-slate-100">{orders.map((o) => <tr key={o.id} className="hover:bg-slate-50">
          <td className="px-4 py-3 font-mono text-xs">{o.num_commande || o.num_devis}</td><td className="px-4 py-3 text-slate-500">{o.date}</td><td className="px-4 py-3">{o.client_nom}</td>
          <td className="px-4 py-3 text-right font-mono">{dh(o.total_ttc)}</td><td className="px-4 py-3 text-center"><Badge tone={statutTone(o.statut)}>{o.statut}</Badge></td>
          <td className="px-4 py-3 text-right whitespace-nowrap">
            {can(perms, "sales.write") && o.statut !== "complet" && <>
              <button onClick={() => setModal({ type: "deliver", client_id: o.client_id, client_nom: o.client_nom })} className="text-xs text-amber-600 px-1">Livrer</button>
              <button onClick={() => setModal({ type: "invoice", client_id: o.client_id, client_nom: o.client_nom, tva: o.taux_tva })} className="text-xs text-emerald-600 px-1">Facturer</button>
            </>}
            {o.stage === "devis" && can(perms, "sales.write") && <button onClick={async () => { await api.confirmSalesOrder(o.id); refresh(); }} className="text-xs text-sky-600 px-1">→Commande</button>}
            {can(perms, "sales.delete") && <button onClick={async () => { if (confirm("Supprimer ?")) { try { await api.deleteSalesOrder(o.id); refresh(); } catch (e) { alert(e.message); } } }} className="text-xs text-red-600 px-1">Suppr.</button>}
          </td></tr>)}
          {orders.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">Aucune commande.</td></tr>}
        </tbody></table></div>}

      {tab === "deliveries" && <SimpleDocTable rows={deliveries} numKey="num_bl" party="client_nom" onDelete={can(perms, "sales.delete") ? async (id) => { await api.deleteDelivery(id); refresh(); } : null} entityType="delivery" />}

      {tab === "invoices" && <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-4 py-3">Facture</th><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Client</th><th className="text-right px-4 py-3">Total</th><th className="text-center px-4 py-3">Règlement</th><th></th></tr></thead>
        <tbody className="divide-y divide-slate-100">{invoices.map((f) => <tr key={f.id} className="hover:bg-slate-50">
          <td className="px-4 py-3 font-mono text-xs">{f.num_facture}</td><td className="px-4 py-3 text-slate-500">{f.date}</td><td className="px-4 py-3">{f.client_nom}</td>
          <td className="px-4 py-3 text-right font-mono">{dh(f.total_ttc)}</td>
          <td className="px-4 py-3 text-center"><Badge tone={payTone(stat(f))}>{stat(f)}{stat(f) === "partielle" ? " · " + dh(reste(f)) : ""}</Badge></td>
          <td className="px-4 py-3 text-right whitespace-nowrap">
            <button onClick={() => setModal({ type: "pay", side: "sale", inv: f })} className="text-xs text-sky-600 px-1">Détails/Règlement</button>
            {can(perms, "sales.delete") && <button onClick={async () => { if (confirm("Supprimer ?")) { await api.deleteCustomerInvoice(f.id); refresh(); } }} className="text-xs text-red-600 px-1">Suppr.</button>}
          </td></tr>)}
          {invoices.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">Aucune facture.</td></tr>}
        </tbody></table></div>}

      {modal?.type === "direct" && <OrderModal title="Vente directe" products={products} parties={clients} partyKey="client_id" onSubmit={async (p) => { await api.saleDirect(p); refresh(); }} onClose={() => setModal(null)} />}
      {modal?.type === "order" && <OrderModal title="Devis / Commande client" products={products} parties={clients} partyKey="client_id" withStage onSubmit={async (p) => { await api.createSalesOrder(p); refresh(); }} onClose={() => setModal(null)} />}
      {modal?.type === "deliver" && <PartialModal mode="delivery" client={modal} onClose={() => setModal(null)} onDone={refresh} />}
      {modal?.type === "invoice" && <PartialModal mode="customer-invoice" client={modal} onClose={() => setModal(null)} onDone={refresh} />}
      {modal?.type === "pay" && <PayModal inv={modal.inv} side="sale" perms={perms} onClose={() => setModal(null)} onDone={refresh} />}
    </div>
  );
}

/* ------------------------------- Achats ------------------------------ */
function Purchases({ perms }) {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]); const [receptions, setReceptions] = useState([]); const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]); const [products, setProducts] = useState([]); const [modal, setModal] = useState(null);
  const load = async () => { setOrders(await api.purchaseOrders()); setReceptions(await api.receptions()); setInvoices(await api.supplierInvoices()); };
  useEffect(() => { load(); api.suppliers().then(setSuppliers); api.products().then(setProducts); }, []);
  const refresh = () => { load(); setModal(null); };
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold">Achats</h1>{can(perms, "purchases.write") && <button onClick={() => setModal({ type: "order" })} className={BTN}>+ Commande fournisseur</button>}</div>
      <div className="flex gap-1 mb-4">{[["orders", "Commandes"], ["receptions", "Réceptions"], ["invoices", "Factures fourn."]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`text-sm px-3 py-1.5 rounded-lg ${tab === k ? "bg-slate-800 text-white" : BTN2}`}>{l}</button>)}</div>

      {tab === "orders" && <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-4 py-3">Commande</th><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Fournisseur</th><th className="text-right px-4 py-3">Total</th><th className="text-center px-4 py-3">Statut</th><th></th></tr></thead>
        <tbody className="divide-y divide-slate-100">{orders.map((o) => <tr key={o.id} className="hover:bg-slate-50">
          <td className="px-4 py-3 font-mono text-xs">{o.num_commande}</td><td className="px-4 py-3 text-slate-500">{o.date}</td><td className="px-4 py-3">{o.fournisseur_nom}</td>
          <td className="px-4 py-3 text-right font-mono">{dh(o.total_ttc)}</td><td className="px-4 py-3 text-center"><Badge tone={statutTone(o.statut)}>{o.statut}</Badge></td>
          <td className="px-4 py-3 text-right whitespace-nowrap">{can(perms, "purchases.write") && o.statut !== "complet" && <>
            <button onClick={() => setModal({ type: "receive", fournisseur_id: o.fournisseur_id, fournisseur_nom: o.fournisseur_nom })} className="text-xs text-amber-600 px-1">Réceptionner</button>
            <button onClick={() => setModal({ type: "sinvoice", fournisseur_id: o.fournisseur_id, fournisseur_nom: o.fournisseur_nom, tva: o.taux_tva })} className="text-xs text-emerald-600 px-1">Facturer</button>
          </>}{can(perms, "purchases.delete") && <button onClick={async () => { if (confirm("Supprimer ?")) { try { await api.deletePurchaseOrder(o.id); refresh(); } catch (e) { alert(e.message); } } }} className="text-xs text-red-600 px-1">Suppr.</button>}</td></tr>)}
          {orders.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">Aucune commande.</td></tr>}
        </tbody></table></div>}

      {tab === "receptions" && <SimpleDocTable rows={receptions} numKey="num_reception" party="fournisseur_nom" onDelete={can(perms, "purchases.delete") ? async (id) => { await api.deleteReception(id); refresh(); } : null} entityType="reception" />}

      {tab === "invoices" && <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-4 py-3">Facture</th><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Fournisseur</th><th className="text-right px-4 py-3">Total</th><th className="text-center px-4 py-3">Règlement</th><th></th></tr></thead>
        <tbody className="divide-y divide-slate-100">{invoices.map((f) => <tr key={f.id} className="hover:bg-slate-50">
          <td className="px-4 py-3 font-mono text-xs">{f.num_facture}</td><td className="px-4 py-3 text-slate-500">{f.date}</td><td className="px-4 py-3">{f.fournisseur_nom}</td>
          <td className="px-4 py-3 text-right font-mono">{dh(f.total_ttc)}</td><td className="px-4 py-3 text-center"><Badge tone={payTone(stat(f))}>{stat(f)}{stat(f) === "partielle" ? " · " + dh(reste(f)) : ""}</Badge></td>
          <td className="px-4 py-3 text-right whitespace-nowrap"><button onClick={() => setModal({ type: "pay", inv: f })} className="text-xs text-sky-600 px-1">Détails/Règlement</button>{can(perms, "purchases.delete") && <button onClick={async () => { if (confirm("Supprimer ?")) { await api.deleteSupplierInvoice(f.id); refresh(); } }} className="text-xs text-red-600 px-1">Suppr.</button>}</td></tr>)}
          {invoices.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">Aucune facture.</td></tr>}
        </tbody></table></div>}

      {modal?.type === "order" && <OrderModal title="Commande fournisseur" products={products} parties={suppliers} partyKey="fournisseur_id" priceField="prix_achat" onSubmit={async (p) => { await api.createPurchaseOrder(p); refresh(); }} onClose={() => setModal(null)} />}
      {modal?.type === "receive" && <PartialModal mode="reception" supplier={modal} onClose={() => setModal(null)} onDone={refresh} />}
      {modal?.type === "sinvoice" && <PartialModal mode="supplier-invoice" supplier={modal} onClose={() => setModal(null)} onDone={refresh} />}
      {modal?.type === "pay" && <PayModal inv={modal.inv} side="purchase" perms={perms} onClose={() => setModal(null)} onDone={refresh} />}
    </div>
  );
}

function SimpleDocTable({ rows, numKey, party, onDelete, entityType }) {
  const [att, setAtt] = useState(null);
  return (<>
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><table className="w-full text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-4 py-3">N°</th><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Tiers</th><th className="text-right px-4 py-3">Total HT</th><th></th></tr></thead>
      <tbody className="divide-y divide-slate-100">{rows.map((r) => <tr key={r.id} className="hover:bg-slate-50">
        <td className="px-4 py-3 font-mono text-xs">{r[numKey]}</td><td className="px-4 py-3 text-slate-500">{r.date}</td><td className="px-4 py-3">{r[party]}</td><td className="px-4 py-3 text-right font-mono">{dh(r.total_ht)}</td>
        <td className="px-4 py-3 text-right whitespace-nowrap"><button onClick={() => setAtt(r)} className="text-slate-400 hover:text-sky-600 px-1">📎</button>{onDelete && <button onClick={() => confirm("Supprimer ? (stock restitué)") && onDelete(r.id)} className="text-xs text-red-600 px-1">Suppr.</button>}</td>
      </tr>)}{rows.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">Aucun document.</td></tr>}</tbody>
    </table></div>
    {att && <Modal title={"Pièces jointes — " + att[numKey]} onClose={() => setAtt(null)}><Attachments entityType={entityType} entityId={att.id} compact /></Modal>}
  </>);
}

/* Modal de création de commande / vente directe */
function OrderModal({ title, products, parties, partyKey, priceField = "prix_vente", withStage, onSubmit, onClose }) {
  const [partyId, setPartyId] = useState(parties[0]?.id || "");
  const [date, setDate] = useState(today()); const [lignes, setLignes] = useState([]); const [stage, setStage] = useState("commande"); const [busy, setBusy] = useState(false);
  const tot = lignes.reduce((a, l) => a + l.prix_unit * l.qte, 0);
  const submit = async () => { if (!lignes.length) return alert("Ajoutez au moins une ligne."); setBusy(true);
    try { await onSubmit({ date, [partyKey]: partyId, taux_tva: 20, stage, lignes }); } catch (e) { alert(e.message); setBusy(false); } };
  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label={partyKey === "client_id" ? "Client" : "Fournisseur"}><select value={partyId} onChange={(e) => setPartyId(e.target.value)} className={I}>{parties.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</select></Field>
        <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={I} /></Field>
      </div>
      {withStage && <div className="mb-3"><Field label="Type"><select value={stage} onChange={(e) => setStage(e.target.value)} className={I + " max-w-[200px]"}><option value="commande">Commande</option><option value="devis">Devis</option></select></Field></div>}
      <LineEditor products={products} lignes={lignes} setLignes={setLignes} priceField={priceField} />
      <div className="flex justify-between items-center mt-4"><span className="font-semibold">Total : <span className="font-mono">{dh(tot)}</span></span>
        <div className="flex gap-2"><button onClick={onClose} className="text-slate-500 px-4 py-2 text-sm">Annuler</button><button disabled={busy} onClick={submit} className={BTN}>{busy ? "…" : "Valider"}</button></div></div>
    </Modal>
  );
}

/* Modal partiel : réception / livraison / facturation (multi-commandes) */
function PartialModal({ mode, client, supplier, onClose, onDone }) {
  const party = client || supplier;
  const isSale = mode === "delivery" || mode === "customer-invoice";
  const isInvoice = mode === "customer-invoice" || mode === "supplier-invoice";
  const partyId = isSale ? party.client_id : party.fournisseur_id;
  const [base, setBase] = useState(isSale ? "livraison" : "reception");
  const [rows, setRows] = useState([]); const [sel, setSel] = useState({}); const [date, setDate] = useState(today()); const [busy, setBusy] = useState(false);
  const loadPending = async () => {
    const type = (mode === "delivery") ? "livraison" : (mode === "reception") ? "reception" : "invoice";
    const b = isInvoice ? base : "";
    const r = isSale ? await api.salesPending(partyId, type, b) : await api.purchasePending(partyId, type, b);
    setRows(r); setSel({});
  };
  useEffect(() => { loadPending(); }, [base]);
  const submit = async () => {
    const lignes = Object.entries(sel).filter(([, v]) => v.qte > 0).map(([order_line_id, v]) => ({ order_line_id, qte: v.qte, ...(v.prix_unit != null ? { prix_unit: v.prix_unit } : {}) }));
    if (!lignes.length) return alert("Saisissez au moins une quantité.");
    setBusy(true);
    try {
      let res;
      if (mode === "delivery") res = await api.createDelivery({ date, client_id: partyId, lignes });
      else if (mode === "customer-invoice") res = await api.createCustomerInvoice({ date, client_id: partyId, base, taux_tva: 20, lignes });
      else if (mode === "reception") res = await api.createReception({ date, fournisseur_id: partyId, lignes });
      else res = await api.createSupplierInvoice({ date, fournisseur_id: partyId, base, taux_tva: 20, lignes });
      if (res.alerts?.length) alert("Enregistré.\n\nAlertes :\n" + res.alerts.join("\n"));
      onDone();
    } catch (e) { alert(e.message); setBusy(false); }
  };
  const titles = { delivery: "Bon de livraison partiel", "customer-invoice": "Facturation (partielle)", reception: "Réception partielle", "supplier-invoice": "Facture fournisseur (partielle)" };
  return (
    <Modal title={titles[mode] + " — " + (party.client_nom || party.fournisseur_nom)} onClose={onClose} wide>
      <div className="flex gap-3 mb-3 items-end">
        <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={I} /></Field>
        {isInvoice && <Field label="Baser la facture sur"><select value={base} onChange={(e) => setBase(e.target.value)} className={I}>
          {isSale ? <><option value="livraison">Ce qui est livré</option><option value="commande">Les quantités commandées</option></>
                  : <><option value="reception">Ce qui est reçu</option><option value="commande">Les quantités commandées</option></>}
        </select></Field>}
      </div>
      <p className="text-xs text-slate-400 mb-2">Regroupe toutes les commandes en attente de ce tiers. Saisissez les quantités à traiter (sur-traitement autorisé avec alerte).</p>
      <PendingPicker rows={rows} sel={sel} setSel={setSel} editablePrice={mode === "reception"} />
      <div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="text-slate-500 px-4 py-2 text-sm">Annuler</button><button disabled={busy} onClick={submit} className={BTN}>{busy ? "…" : "Valider"}</button></div>
    </Modal>
  );
}

/* Modal règlements : encaissement/décaissement + ANNULATION (corrige le bug) */
function PayModal({ inv, side, perms, onClose, onDone }) {
  const [doc, setDoc] = useState(inv);
  const [montant, setMontant] = useState(reste(inv).toFixed(2)); const [mode, setMode] = useState("Espèces"); const [date, setDate] = useState(today());
  const payPerm = side === "sale" ? "sales.pay" : "purchases.pay";
  const refreshDoc = async () => {
    const list = side === "sale" ? await api.customerInvoices() : await api.supplierInvoices();
    const u = list.find((x) => x.id === inv.id); if (u) setDoc(u);
  };
  const pay = async () => { const p = { montant: +montant, mode, date }; if (!(p.montant > 0)) return;
    await (side === "sale" ? api.payCustomerInvoice(inv.id, p) : api.paySupplierInvoice(inv.id, p)); await refreshDoc(); onDone && onDone(); };
  const cancel = async (payId) => { if (!confirm("Annuler ce règlement ? La facture redeviendra non soldée.")) return;
    await (side === "sale" ? api.cancelCustomerPayment(inv.id, payId) : api.cancelSupplierPayment(inv.id, payId)); await refreshDoc(); onDone && onDone(); };
  const r = doc.reglement || { paye: 0, reste: doc.total_ttc, statut: "non réglée" };
  return (
    <Modal title={"Facture " + (doc.num_facture) + " — " + (doc.client_nom || doc.fournisseur_nom)} onClose={onClose}>
      <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-slate-500">Total TTC</span><span className="font-mono">{dh(doc.total_ttc)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Déjà réglé</span><span className="font-mono text-emerald-600">{dh(r.paye)}</span></div>
        <div className="flex justify-between font-semibold"><span>Reste à payer</span><span className="font-mono text-red-600">{dh(r.reste)}</span></div>
        <div className="text-center pt-1"><Badge tone={payTone(r.statut)}>{r.statut}</Badge></div>
      </div>
      <div className="mb-3"><h4 className="text-xs font-semibold text-slate-500 mb-1">Détail des lignes</h4><ul className="text-xs text-slate-600 space-y-0.5">{(doc.lignes || []).map((l, i) => <li key={i} className="flex justify-between"><span>{l.nom} × {l.qte}</span><span className="font-mono">{dh(l.prix_unit * l.qte)}</span></li>)}</ul></div>
      <div className="mb-3"><h4 className="text-xs font-semibold text-slate-500 mb-1">Règlements</h4>
        {(doc.paiements || []).length === 0 ? <p className="text-xs text-slate-400">Aucun.</p> : <ul className="space-y-1">{doc.paiements.map((p) => <li key={p.id} className="flex justify-between items-center text-sm bg-white border border-slate-100 rounded px-2 py-1"><span>{p.date} · {dh(p.montant)} · {p.mode}</span>{can(perms, payPerm) && <button onClick={() => cancel(p.id)} className="text-red-600 text-xs">Annuler</button>}</li>)}</ul>}
      </div>
      {can(perms, payPerm) && r.reste > 0.01 && <div className="border-t border-slate-200 pt-3 grid grid-cols-3 gap-2 items-end">
        <Field label="Montant"><input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} className={I} /></Field>
        <Field label="Mode"><select value={mode} onChange={(e) => setMode(e.target.value)} className={I}>{["Espèces", "Chèque", "Virement", "Carte", "Effet", "Crédit"].map((m) => <option key={m}>{m}</option>)}</select></Field>
        <button onClick={pay} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm">Encaisser</button>
      </div>}
      <div className="flex justify-end mt-4"><button onClick={onClose} className="text-slate-500 px-4 py-2 text-sm">Fermer</button></div>
    </Modal>
  );
}

/* ----------------------------- Paramètres ---------------------------- */
function Settings({ perms }) {
  const [s, setS] = useState(null); const [saved, setSaved] = useState(false);
  useEffect(() => { api.settings().then(setS); }, []);
  if (!s) return <div className="p-6 text-slate-400">Chargement…</div>;
  const up = (k, v) => { setS({ ...s, [k]: v }); setSaved(false); };
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Paramètres</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <Field label="Nom de l'entreprise"><input value={s.nom_entreprise || ""} onChange={(e) => up("nom_entreprise", e.target.value)} className={I} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="ICE"><input value={s.ice || ""} onChange={(e) => up("ice", e.target.value)} className={I} /></Field><Field label="RC"><input value={s.rc || ""} onChange={(e) => up("rc", e.target.value)} className={I} /></Field></div>
        <Field label="Adresse"><input value={s.adresse || ""} onChange={(e) => up("adresse", e.target.value)} className={I} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Ville"><input value={s.ville || ""} onChange={(e) => up("ville", e.target.value)} className={I} /></Field><Field label="Téléphone"><input value={s.tel || ""} onChange={(e) => up("tel", e.target.value)} className={I} /></Field></div>
        <Field label="TVA (%)"><input type="number" value={s.tva || 20} onChange={(e) => up("tva", +e.target.value)} className={I + " max-w-[120px]"} /></Field>
        {can(perms, "settings.write") && <div className="flex items-center gap-3"><button onClick={async () => { await api.saveSettings(s); setSaved(true); }} className={BTN}>Enregistrer</button>{saved && <span className="text-emerald-600 text-sm">✓ Enregistré</span>}</div>}
      </div>
    </div>
  );
}
