import { useState, useEffect } from "react";
import { api } from "./api";

const dh = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " DH";

/* Module Créances (clients) & Dettes (fournisseurs) avec situation + relevé */
export default function Finance() {
  const [tab, setTab] = useState("clients");
  const [rows, setRows] = useState([]);
  const [statement, setStatement] = useState(null);
  const load = async () => { setRows(tab === "clients" ? await api.financeClients() : await api.financeSuppliers()); setStatement(null); };
  useEffect(() => { load(); }, [tab]);
  const openStatement = async (id) => setStatement(tab === "clients" ? await api.clientStatement(id) : await api.supplierStatement(id));

  const totalDu = rows.reduce((a, r) => a + (r.solde_du || 0), 0);
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Créances & Dettes</h1>
      <p className="text-sm text-slate-400 mb-5">Situation et relevé de compte par {tab === "clients" ? "client" : "fournisseur"}.</p>
      <div className="flex gap-1 mb-4">
        {[["clients", "Créances clients"], ["suppliers", "Dettes fournisseurs"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`text-sm px-4 py-2 rounded-lg ${tab === k ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{l}</button>
        ))}
        <div className="ms-auto bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm">
          Total {tab === "clients" ? "à encaisser" : "à régler"} : <span className="font-bold font-mono text-amber-700">{dh(totalDu)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr>
            <th className="text-start px-4 py-3">{tab === "clients" ? "Client" : "Fournisseur"}</th>
            <th className="text-end px-4 py-3">Total facturé</th><th className="text-end px-4 py-3">Réglé</th>
            <th className="text-end px-4 py-3">Solde dû</th><th></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{r.nom}{r.ville ? <span className="text-slate-400 font-normal"> · {r.ville}</span> : null}</td>
                <td className="px-4 py-3 text-end font-mono text-slate-500">{dh(r.total_facture)}</td>
                <td className="px-4 py-3 text-end font-mono text-emerald-600">{dh(r.total_regle)}</td>
                <td className="px-4 py-3 text-end font-mono font-semibold" style={{ color: r.solde_du > 0 ? "#dc2626" : "#64748b" }}>{dh(r.solde_du)}</td>
                <td className="px-4 py-3 text-end"><button onClick={() => openStatement(r.id)} className="text-xs text-sky-600 hover:underline">Relevé</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate-400">Aucune donnée.</td></tr>}
          </tbody>
        </table>
      </div>

      {statement && <StatementModal data={statement} kind={tab} onClose={() => setStatement(null)} />}
    </div>
  );
}

function StatementModal({ data, kind, onClose }) {
  const nom = (data.client || data.fournisseur)?.nom;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-3xl my-8 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div><h3 className="font-bold text-lg">Relevé de compte — {nom}</h3><p className="text-xs text-slate-400">Débit = facture · Crédit = règlement</p></div>
          <button onClick={onClose} className="text-slate-400">✕</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-400">Total facturé</div><div className="font-mono font-bold">{dh(data.total_facture)}</div></div>
          <div className="bg-emerald-50 rounded-lg p-3"><div className="text-xs text-slate-400">Total réglé</div><div className="font-mono font-bold text-emerald-700">{dh(data.total_regle)}</div></div>
          <div className="bg-red-50 rounded-lg p-3"><div className="text-xs text-slate-400">Solde dû</div><div className="font-mono font-bold text-red-600">{dh(data.solde_du)}</div></div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-white text-xs"><tr><th className="text-start px-3 py-2">Date</th><th className="text-start px-3 py-2">Pièce</th><th className="text-start px-3 py-2">Libellé</th><th className="text-end px-3 py-2">Débit</th><th className="text-end px-3 py-2">Crédit</th><th className="text-end px-3 py-2">Solde</th></tr></thead>
          <tbody>
            {data.mouvements.map((m, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-3 py-2">{m.date}</td><td className="px-3 py-2 font-mono text-xs">{m.piece}</td><td className="px-3 py-2">{m.libelle}</td>
                <td className="px-3 py-2 text-end font-mono">{m.debit ? dh(m.debit) : ""}</td>
                <td className="px-3 py-2 text-end font-mono text-emerald-600">{m.credit ? dh(m.credit) : ""}</td>
                <td className="px-3 py-2 text-end font-mono font-semibold">{dh(m.solde)}</td>
              </tr>
            ))}
            {data.mouvements.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-slate-400">Aucun mouvement.</td></tr>}
          </tbody>
        </table>
        <div className="flex justify-end mt-4"><button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">Imprimer</button></div>
      </div>
    </div>
  );
}
