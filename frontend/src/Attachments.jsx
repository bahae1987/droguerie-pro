import { useState, useEffect } from "react";
import { api } from "./api";

/* Composant réutilisable de pièces jointes.
   Usage : <Attachments entityType="client" entityId={client.id} />
   entityType : client | supplier | product | purchase_order | reception |
                supplier_invoice | sales_order | delivery | customer_invoice | trip | expense */
export default function Attachments({ entityType, entityId, compact }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const load = async () => { if (entityId) setFiles(await api.attachments(entityType, entityId)); };
  useEffect(() => { load(); }, [entityType, entityId]);

  const onUpload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    try { await api.uploadAttachment(entityType, entityId, f); await load(); }
    catch (err) { alert(err.message); } finally { setBusy(false); e.target.value = ""; }
  };
  const del = async (id) => { if (confirm("Supprimer cette pièce jointe ?")) { await api.deleteAttachment(id); load(); } };
  const kb = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + " Mo" : Math.max(1, Math.round(n / 1024)) + " Ko";

  return (
    <div className={compact ? "" : "bg-white rounded-xl border border-slate-200 p-4"}>
      {!compact && <h3 className="font-semibold text-slate-700 text-sm mb-3">Pièces jointes</h3>}
      <ul className="space-y-1 mb-3">
        {files.map((f) => (
          <li key={f.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
            <button onClick={() => api.downloadAttachment(f.id, f.original_name)} className="text-sky-600 hover:underline truncate pe-2 text-start">{f.original_name}</button>
            <span className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-400">{kb(f.size)}</span>
              <button onClick={() => del(f.id)} className="text-slate-400 hover:text-red-600">✕</button>
            </span>
          </li>
        ))}
        {files.length === 0 && <li className="text-xs text-slate-400">Aucune pièce jointe.</li>}
      </ul>
      <label className="inline-flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg cursor-pointer">
        {busy ? "Envoi…" : "+ Ajouter un fichier"}
        <input type="file" onChange={onUpload} disabled={busy} className="hidden" />
      </label>
    </div>
  );
}
