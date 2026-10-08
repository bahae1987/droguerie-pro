import { useState, useEffect } from "react";
import { api } from "./api";

const dh = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " DH";
const today = () => new Date().toISOString().slice(0, 10);

/* Module Charges & Déplacements — marge nette par déplacement */
export default function Charges() {
  const [trips, setTrips] = useState([]);
  const [cats, setCats] = useState([]);
  const [sel, setSel] = useState(null);       // déplacement sélectionné
  const [margin, setMargin] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [tripForm, setTripForm] = useState(null);
  const [expForm, setExpForm] = useState(null);

  const loadTrips = async () => setTrips(await api.trips());
  useEffect(() => { loadTrips(); api.expenseCategories().then(setCats); }, []);
  const openTrip = async (t) => { setSel(t); setMargin(await api.tripMargin(t.id)); setExpenses(await api.expenses(t.id)); };
  const refresh = async () => { if (sel) { setMargin(await api.tripMargin(sel.id)); setExpenses(await api.expenses(sel.id)); } loadTrips(); };

  const saveTrip = async (t) => { await api.saveTrip(t); setTripForm(null); loadTrips(); };
  const saveExp = async (e) => { await api.saveExpense({ ...e, trip_id: sel?.id || e.trip_id || null }); setExpForm(null); refresh(); };
  const delExp = async (id) => { if (confirm("Supprimer cette charge ?")) { await api.deleteExpense(id); refresh(); } };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-bold">Charges & Déplacements</h1><p className="text-sm text-slate-400">Suivi des charges et calcul de la marge nette par déplacement.</p></div>
        <button onClick={() => setTripForm({ date: today() })} className="bg-amber-500 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm">+ Nouveau déplacement</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-3">
          <h3 className="font-semibold text-slate-600 text-sm mb-2 px-1">Déplacements</h3>
          <ul className="space-y-1">
            {trips.map((t) => (
              <li key={t.id}><button onClick={() => openTrip(t)} className={`w-full text-start px-3 py-2 rounded-lg text-sm ${sel?.id === t.id ? "bg-amber-100 text-amber-800" : "hover:bg-slate-50"}`}>
                <div className="font-medium">{t.libelle || t.num_dep}</div>
                <div className="text-[11px] text-slate-400">{t.num_dep} · {t.date}{t.destination ? " · " + t.destination : ""}</div>
              </button></li>
            ))}
            {trips.length === 0 && <li className="text-xs text-slate-400 px-3 py-2">Aucun déplacement.</li>}
          </ul>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!sel && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">Sélectionnez un déplacement pour voir sa marge nette et ses charges.</div>}
          {sel && margin && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex justify-between items-start mb-3"><h3 className="font-semibold">{sel.libelle || sel.num_dep}</h3><span className="text-xs text-slate-400">{sel.num_dep}</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <Kpi label="CA (HT)" value={dh(margin.ca_ht)} />
                  <Kpi label="Marge brute" value={dh(margin.marge_brute)} tone="#0369a1" />
                  <Kpi label="Charges" value={dh(margin.total_charges)} tone="#dc2626" />
                  <Kpi label="Marge NETTE" value={dh(margin.marge_nette)} tone={margin.marge_nette >= 0 ? "#059669" : "#dc2626"} big />
                </div>
                <p className="text-xs text-slate-400 mt-3">{margin.nb_factures} facture(s) rattachée(s) · Taux de marge nette : {margin.taux_marge.toFixed(1)}%</p>
                {margin.detail_charges?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{margin.detail_charges.map((d) => <span key={d.categorie} className="text-xs bg-slate-100 rounded-full px-2 py-0.5">{d.categorie} : {dh(d.total)}</span>)}</div>}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-slate-700 text-sm">Charges du déplacement</h3><button onClick={() => setExpForm({ date: today(), categorie: cats[0] })} className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">+ Charge</button></div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr><th className="text-start px-3 py-2">Date</th><th className="text-start px-3 py-2">Catégorie</th><th className="text-start px-3 py-2">Libellé</th><th className="text-end px-3 py-2">Montant</th><th></th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((e) => (
                      <tr key={e.id}><td className="px-3 py-2">{e.date}</td><td className="px-3 py-2"><span className="text-xs bg-slate-100 rounded-full px-2 py-0.5">{e.categorie}</span></td><td className="px-3 py-2 text-slate-600">{e.libelle}</td><td className="px-3 py-2 text-end font-mono">{dh(e.montant)}</td><td className="px-2"><button onClick={() => delExp(e.id)} className="text-slate-300 hover:text-red-500">✕</button></td></tr>
                    ))}
                    {expenses.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">Aucune charge.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {tripForm && <TripModal form={tripForm} onSave={saveTrip} onClose={() => setTripForm(null)} />}
      {expForm && <ExpenseModal form={expForm} cats={cats} onSave={saveExp} onClose={() => setExpForm(null)} />}
    </div>
  );
}
const Kpi = ({ label, value, tone, big }) => (
  <div className={`rounded-lg p-3 ${big ? "bg-slate-900" : "bg-slate-50"}`}><div className={`text-xs ${big ? "text-slate-400" : "text-slate-400"}`}>{label}</div><div className="font-mono font-bold" style={{ color: big ? (tone || "#fff") : tone, fontSize: big ? 18 : 15 }}>{value}</div></div>
);
const I = "w-full border rounded-lg px-3 py-2 text-sm mt-1";
const L = ({ label, children }) => <label className="block"><span className="text-xs text-slate-500">{label}</span>{children}</label>;
function Wrap({ title, onClose, children }) { return <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}><div className="bg-white rounded-xl w-full max-w-md my-8 p-5" onClick={(e) => e.stopPropagation()}><div className="flex justify-between mb-4"><h3 className="font-semibold">{title}</h3><button onClick={onClose}>✕</button></div>{children}</div></div>; }
function TripModal({ form, onSave, onClose }) {
  const [f, setF] = useState(form); const up = (k, v) => setF({ ...f, [k]: v });
  return <Wrap title={f.id ? "Modifier le déplacement" : "Nouveau déplacement"} onClose={onClose}>
    <div className="space-y-3">
      <L label="Libellé"><input value={f.libelle || ""} onChange={(e) => up("libelle", e.target.value)} className={I} placeholder="Tournée Agadir" /></L>
      <div className="grid grid-cols-2 gap-3"><L label="Date"><input type="date" value={f.date || ""} onChange={(e) => up("date", e.target.value)} className={I} /></L><L label="Destination"><input value={f.destination || ""} onChange={(e) => up("destination", e.target.value)} className={I} /></L></div>
      <div className="grid grid-cols-2 gap-3"><L label="Responsable"><input value={f.responsable || ""} onChange={(e) => up("responsable", e.target.value)} className={I} /></L><L label="Véhicule"><input value={f.vehicule || ""} onChange={(e) => up("vehicule", e.target.value)} className={I} /></L></div>
    </div>
    <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="text-slate-500 px-4 py-2 text-sm">Annuler</button><button onClick={() => onSave(f)} className="bg-amber-500 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm">Enregistrer</button></div>
  </Wrap>;
}
function ExpenseModal({ form, cats, onSave, onClose }) {
  const [f, setF] = useState(form); const up = (k, v) => setF({ ...f, [k]: v });
  return <Wrap title="Nouvelle charge" onClose={onClose}>
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3"><L label="Date"><input type="date" value={f.date || ""} onChange={(e) => up("date", e.target.value)} className={I} /></L><L label="Catégorie"><select value={f.categorie} onChange={(e) => up("categorie", e.target.value)} className={I}>{cats.map((c) => <option key={c}>{c}</option>)}</select></L></div>
      <L label="Libellé"><input value={f.libelle || ""} onChange={(e) => up("libelle", e.target.value)} className={I} placeholder="Gasoil, repas équipe…" /></L>
      <div className="grid grid-cols-2 gap-3"><L label="Montant (DH)"><input type="number" value={f.montant || ""} onChange={(e) => up("montant", +e.target.value)} className={I} /></L><L label="Bénéficiaire"><input value={f.beneficiaire || ""} onChange={(e) => up("beneficiaire", e.target.value)} className={I} /></L></div>
    </div>
    <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="text-slate-500 px-4 py-2 text-sm">Annuler</button><button onClick={() => onSave(f)} className="bg-amber-500 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm">Enregistrer</button></div>
  </Wrap>;
}
