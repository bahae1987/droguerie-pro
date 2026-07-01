import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api, can, clearSession, dh, getSession, setSession } from './api';
import './index.css';

const today = () => new Date().toISOString().slice(0, 10);

const TR = {
  fr: {
    login: 'Connexion',
    username: 'Utilisateur',
    password: 'Mot de passe',
    connect: 'Se connecter',
    dashboard: 'Tableau de bord',
    products: 'Produits / Stock',
    sales: 'Ventes',
    purchases: 'Achats',
    payments: 'Paiements',
    clients: 'Clients',
    suppliers: 'Fournisseurs',
    users: 'Utilisateurs',
    logout: 'Déconnexion',
    new: 'Nouveau',
    create: 'Créer',
    direct: 'Direct',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Suppr.',
    actions: 'Actions',
    ref: 'Réf',
    name: 'Nom',
    category: 'Catégorie',
    stock: 'Stock',
    price: 'Prix',
    date: 'Date',
    customer: 'Client',
    supplier: 'Fournisseur',
    status: 'Étape',
    total: 'Total',
    payment: 'Règlement',
    all: 'Tous',
    quotes: 'Devis',
    orders: 'Commandes',
    deliveries: 'Livraisons',
    invoices: 'Factures',
    receipts: 'Réceptions',
    advance: 'Avancer',
    settle: 'Régler',
    partialDelivery: 'Liv. part.',
    partialReceipt: 'Réc. part.',
    base: 'Base',
    linked: 'lié',
    cashIn: 'Encaissements',
    cashOut: 'Décaissements',
    language: 'العربية',
    paid: 'réglée',
    unpaid: 'non réglée',
    partial: 'partielle',
    remaining: 'reste',
    stockAdjust: 'Ajustement stock',
    quantity: 'Quantité',
    reason: 'Motif',
    validate: 'Valider',
    cancel: 'Annuler',
    role: 'Profil',
    active: 'Actif'
  },
  ar: {
    login: 'تسجيل الدخول',
    username: 'المستخدم',
    password: 'كلمة المرور',
    connect: 'دخول',
    dashboard: 'لوحة القيادة',
    products: 'المنتجات / المخزون',
    sales: 'المبيعات',
    purchases: 'المشتريات',
    payments: 'الأداءات',
    clients: 'الزبناء',
    suppliers: 'الموردون',
    users: 'المستخدمون',
    logout: 'خروج',
    new: 'جديد',
    create: 'إنشاء',
    direct: 'مباشر',
    save: 'حفظ',
    edit: 'تعديل',
    delete: 'حذف',
    actions: 'الإجراءات',
    ref: 'المرجع',
    name: 'الاسم',
    category: 'الصنف',
    stock: 'المخزون',
    price: 'الثمن',
    date: 'التاريخ',
    customer: 'الزبون',
    supplier: 'المورد',
    status: 'المرحلة',
    total: 'المجموع',
    payment: 'الأداء',
    all: 'الكل',
    quotes: 'العروض',
    orders: 'الطلبيات',
    deliveries: 'التسليمات',
    invoices: 'الفواتير',
    receipts: 'الاستلامات',
    advance: 'المرحلة التالية',
    settle: 'تسوية',
    partialDelivery: 'تسليم جزئي',
    partialReceipt: 'استلام جزئي',
    base: 'الأصل',
    linked: 'مرتبط',
    cashIn: 'المداخيل',
    cashOut: 'المصاريف',
    language: 'Français',
    paid: 'مؤداة',
    unpaid: 'غير مؤداة',
    partial: 'جزئية',
    remaining: 'الباقي',
    stockAdjust: 'تعديل المخزون',
    quantity: 'الكمية',
    reason: 'السبب',
    validate: 'تأكيد',
    cancel: 'إلغاء',
    role: 'الصلاحية',
    active: 'نشط'
  }
};

function useLang() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'fr');
  const toggle = () => {
    const next = lang === 'fr' ? 'ar' : 'fr';
    localStorage.setItem('lang', next);
    setLang(next);
  };
  const L = k => TR[lang]?.[k] || k;
  return { lang, L, toggle };
}

function Login({ onLogin, L, lang }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const s = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      setSession(s);
      onLogin(s);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className={`min-h-screen grid place-items-center bg-slate-900 ${lang === 'ar' ? 'rtl' : ''}`}>
      <form onSubmit={submit} className="bg-white p-7 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <span className="bg-amber-500 font-black rounded-xl w-12 h-12 grid place-items-center">DP</span>
          <div>
            <h1 className="font-bold text-xl">DrogueriePro</h1>
            <p className="text-xs text-slate-400">{L('login')}</p>
          </div>
        </div>
        {err && <p className="bg-red-50 text-red-600 text-sm p-2 rounded mb-3">{err}</p>}
        <label className="text-xs text-slate-500">{L('username')}</label>
        <input className="input mb-3" value={username} onChange={e => setUsername(e.target.value)} />
        <label className="text-xs text-slate-500">{L('password')}</label>
        <input className="input mb-4" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn w-full bg-amber-500 text-slate-900">{L('connect')}</button>
      </form>
    </div>
  );
}

function Shell({ session, setSessionState, lang, L, toggle }) {
  const [page, setPage] = useState('dashboard');

  const menu = [
    ['dashboard', L('dashboard'), 'dashboard.read'],
    ['products', L('products'), 'products.read'],
    ['sales', L('sales'), 'sales.read'],
    ['purchases', L('purchases'), 'purchases.read'],
    ['payments', L('payments'), 'sales.read'],
    ['clients', L('clients'), 'clients.read'],
    ['suppliers', L('suppliers'), 'suppliers.read'],
    ['users', L('users'), 'users.read']
  ].filter(x => can(session.perms, x[2]));

  return (
    <div className={`${lang === 'ar' ? 'rtl' : ''}`}>
      <div className="min-h-screen flex">
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
          <div className="p-5 border-b border-slate-800">
            <div className="font-bold text-white text-xl">Droguerie<span className="text-amber-500">Pro</span></div>
            <div className="text-xs text-slate-500">{session.user?.full_name} · {session.user?.role}</div>
          </div>

          <nav className="p-3 flex-1 space-y-1">
            {menu.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setPage(id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${page === id ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-slate-800'}`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-800 space-y-2">
            <button onClick={toggle} className="btn bg-slate-800 w-full">{L('language')}</button>
            <button onClick={() => { clearSession(); setSessionState(null); }} className="btn bg-slate-800 w-full">{L('logout')}</button>
          </div>
        </aside>

        <main className="flex-1 p-6 max-w-[1500px] mx-auto w-full">
          {page === 'dashboard' && <Dashboard L={L} />}
          {page === 'products' && <Products L={L} perms={session.perms} />}
          {page === 'sales' && <Docs L={L} type="sales" perms={session.perms} />}
          {page === 'purchases' && <Docs L={L} type="purchases" perms={session.perms} />}
          {page === 'payments' && <Payments L={L} />}
          {page === 'clients' && <SimpleList L={L} type="clients" />}
          {page === 'suppliers' && <SimpleList L={L} type="suppliers" />}
          {page === 'users' && <UsersPage L={L} />}
        </main>
      </div>
    </div>
  );
}

function Header({ title, children }) {
  return <div className="flex justify-between items-end mb-5"><h1 className="text-2xl font-bold text-slate-800">{title}</h1><div className="flex gap-2">{children}</div></div>;
}

function Modal({ title, onClose, children, wide = false }) {
  return <div className="fixed inset-0 bg-slate-900/60 z-50 grid place-items-center p-4 overflow-auto"><div className={`bg-white rounded-2xl shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-lg'} w-full p-5`}><div className="flex justify-between mb-4"><h2 className="font-bold text-lg">{title}</h2><button onClick={onClose}>✕</button></div>{children}</div></div>;
}

function Badge({ children, tone = 'slate' }) {
  const cls = { emerald: 'bg-emerald-100 text-emerald-700', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700', blue: 'bg-sky-100 text-sky-700', slate: 'bg-slate-100 text-slate-700' }[tone];
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>{children}</span>;
}

function payStatus(d, L) {
  const status = d.statutPaiement || 'non_reglee';
  const label = status === 'reglee' ? L('paid') : status === 'partielle' ? L('partial') : L('unpaid');
  return <Badge tone={status === 'reglee' ? 'emerald' : status === 'partielle' ? 'amber' : 'red'}>{label}{d.reste > 0 ? ` · ${L('remaining')} ${dh(d.reste)}` : ''}</Badge>;
}

function Dashboard({ L }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api('/dashboard').then(setD).catch(e => setErr(e.message));
  useEffect(load, []);
  if (err) return <ErrorBox msg={err} />;
  if (!d) return <p>Chargement...</p>;

  const cards = [[L('sales'), dh(d.ca)], [L('stock'), dh(d.stockValue)], [L('products'), d.products], ['Alertes', d.lowStock], ['Dettes', dh(d.dettes || 0)]];
  return <><Header title={L('dashboard')}><button onClick={load} className="btn bg-white border">↻</button></Header><div className="grid grid-cols-1 md:grid-cols-5 gap-4">{cards.map(c => <div className="card p-5" key={c[0]}><p className="text-xs text-slate-400">{c[0]}</p><p className="text-2xl font-black font-mono mt-2">{c[1]}</p></div>)}</div></>;
}

function Products({ L, perms }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [stock, setStock] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api('/products').then(setRows).catch(e => setErr(e.message));
  useEffect(load, []);
  async function save() { await api(form.id ? `/products/${form.id}` : '/products', { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(form) }); setForm(null); load(); }
  async function del(id) { if (!confirm('Supprimer ?')) return; await api(`/products/${id}`, { method: 'DELETE' }); load(); }
  async function adjust() { await api(`/products/${stock.id}/stock`, { method: 'POST', body: JSON.stringify({ qte: Number(stock.qte), reason: stock.reason || L('stockAdjust') }) }); setStock(null); load(); }
  if (err) return <ErrorBox msg={err} />;

  return <><Header title={L('products')}>{can(perms, 'products.write') && <button onClick={() => setForm({ nom: '', ref: '', categorie: 'Divers', unite: 'Pièce', prixAchat: 0, prixVente: 0, quantite: 0, stockMin: 0 })} className="btn bg-amber-500">{L('new')}</button>}</Header><Table><thead><tr><th>{L('ref')}</th><th>{L('name')}</th><th>{L('category')}</th><th>{L('stock')}</th><th>{L('price')}</th><th>{L('actions')}</th></tr></thead><tbody>{rows.map(p => <tr key={p.id}><td className="font-mono text-xs">{p.ref}</td><td className="font-semibold">{p.nom}</td><td>{p.categorie}</td><td className={p.quantite <= p.stockMin ? 'text-red-600 font-bold' : ''}>{p.quantite} {p.unite}</td><td>{dh(p.prixVente)}</td><td className="flex gap-1"><button className="btn bg-white border" onClick={() => setForm(p)}>{L('edit')}</button><button className="btn bg-white border" onClick={() => setStock({ ...p, qte: 1, reason: L('stockAdjust') })}>{L('stock')}</button><button className="btn bg-red-600 text-white" onClick={() => del(p.id)}>{L('delete')}</button></td></tr>)}</tbody></Table>{form && <ProductModal L={L} form={form} setForm={setForm} save={save} close={() => setForm(null)} />}{stock && <Modal title={`${L('stockAdjust')} · ${stock.nom}`} onClose={() => setStock(null)}><label className="text-xs text-slate-500">{L('quantity')}<input className="input mt-1 mb-2" type="number" value={stock.qte} onChange={e => setStock({ ...stock, qte: e.target.value })} /></label><label className="text-xs text-slate-500">{L('reason')}<input className="input mt-1" value={stock.reason} onChange={e => setStock({ ...stock, reason: e.target.value })} /></label><button onClick={adjust} className="btn bg-amber-500 mt-4">{L('validate')}</button></Modal>}</>;
}

function ProductModal({ L, form, setForm, save, close }) {
  const fields = [['ref', L('ref')], ['nom', L('name')], ['categorie', L('category')], ['unite', 'Unité'], ['prixAchat', 'Prix achat'], ['prixVente', 'Prix vente'], ['quantite', L('quantity')], ['stockMin', 'Seuil']];
  return <Modal title={L('products')} onClose={close}><div className="grid grid-cols-2 gap-3">{fields.map(([k, l]) => <label key={k} className="text-xs text-slate-500">{l}<input className="input mt-1" value={form[k] ?? ''} onChange={e => setForm({ ...form, [k]: ['prixAchat', 'prixVente', 'quantite', 'stockMin'].includes(k) ? +e.target.value : e.target.value })} /></label>)}</div><button onClick={save} className="btn bg-amber-500 mt-4">{L('save')}</button></Modal>;
}

function Docs({ L, type, perms }) {
  const isSales = type === 'sales';
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [parties, setParties] = useState([]);
  const [form, setForm] = useState(null);
  const [pay, setPay] = useState(null);
  const [partial, setPartial] = useState(null);
  const [tab, setTab] = useState('tous');
  const [err, setErr] = useState('');
  const load = () => Promise.all([api(`/${type}`), api('/products'), api(isSales ? '/clients' : '/suppliers')]).then(([a, b, c]) => { setRows(a); setProducts(b); setParties(c); }).catch(e => setErr(e.message));
  useEffect(load, []);
  const perm = isSales ? 'sales.write' : 'purchases.write';
  const stages = isSales ? [['tous', L('all')], ['devis', L('quotes')], ['commande', L('orders')], ['livraison', L('deliveries')], ['facture', L('invoices')]] : [['tous', L('all')], ['commande', L('orders')], ['reception', L('receipts')], ['facture', L('invoices')]];
  const filtered = tab === 'tous' ? rows : rows.filter(x => x.stage === tab);

  function create(start) { setForm({ start, date: today(), partyId: parties[0]?.id || '', lignes: [{ produitId: products[0]?.id || '', qte: 1 }] }); }
  async function save() {
    const lines = form.lignes.map(l => { const prod = products.find(x => String(x.id) === String(l.produitId)); if (!prod) throw new Error('Produit non sélectionné'); return { produitId: prod.id, ref: prod.ref, nom: prod.nom, prixUnit: isSales ? prod.prixVente : prod.prixAchat, qte: Number(l.qte) }; });
    const party = parties.find(x => String(x.id) === String(form.partyId)); if (!party) throw new Error(isSales ? 'Client non sélectionné' : 'Fournisseur non sélectionné');
    const body = { start: form.start, date: form.date, lignes: lines, tauxTva: 20, clientId: party.id, clientNom: party.name || party.nom, fournisseurId: party.id, fournisseurNom: party.name || party.nom };
    await api(form.id ? `/${type}/${form.id}` : `/${type}`, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    setForm(null); load();
  }
  async function advance(id) { await api(`/${type}/${id}/advance`, { method: 'POST', body: '{}' }); load(); }
  async function del(id) { if (!confirm('Supprimer ?')) return; await api(`/${type}/${id}`, { method: 'DELETE' }); load(); }
  async function settle() { await api(`/${type}/${pay.id}/pay`, { method: 'POST', body: JSON.stringify({ date: pay.date, mode: pay.mode, montant: Number(pay.montant) }) }); setPay(null); load(); }
  async function doPartial() { await api(`/${type}/${partial.doc.id}/partial`, { method: 'POST', body: JSON.stringify({ qte: Number(partial.qte) }) }); setPartial(null); load(); }
  if (err) return <ErrorBox msg={err} />;

  return <><Header title={isSales ? L('sales') : L('purchases')}>{can(perms, perm) && <><button onClick={() => create(isSales ? 'devis' : 'commande')} className="btn bg-white border">{L('create')}</button><button onClick={() => create(isSales ? 'facture' : 'reception')} className="btn bg-amber-500">{L('direct')}</button></>}</Header><div className="flex gap-1 mb-4 flex-wrap">{stages.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg text-sm ${tab === k ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500'}`}>{l}</button>)}</div><Table><thead><tr><th>N°</th><th>{L('base')}</th><th>{L('date')}</th><th>{isSales ? L('customer') : L('supplier')}</th><th>{L('status')}</th><th>{L('total')}</th><th>{L('payment')}</th><th>{L('actions')}</th></tr></thead><tbody>{filtered.map(d => <tr key={d.id}><td className="font-mono text-xs">{Object.values(d.numeros || {})[0] || '#' + d.id}</td><td>{d.baseDocId ? <Badge tone="blue">{L('linked')} #{d.baseDocId}</Badge> : '-'}</td><td>{d.date}</td><td>{d.client_name || d.supplier_name || d.clientNom || d.fournisseurNom}</td><td><Badge tone="blue">{d.stage}</Badge></td><td>{dh(d.total_ttc ?? d.totalTTC)}</td><td>{payStatus(d, L)}</td><td className="flex gap-1 flex-wrap"><button onClick={() => advance(d.id)} className="btn bg-slate-800 text-white">{L('advance')}</button><button onClick={() => setPay({ ...d, date: today(), mode: 'Espèces', montant: d.reste || d.totalTTC || d.total_ttc })} className="btn bg-emerald-600 text-white">{L('settle')}</button>{d.stage !== 'facture' && <button onClick={() => setPartial({ doc: d, qte: d.lignes?.[0]?.qte || 1 })} className="btn bg-white border">{isSales ? L('partialDelivery') : L('partialReceipt')}</button>}<button onClick={() => setForm({ id: d.id, start: d.stage, date: d.date, partyId: isSales ? d.client_id : d.supplier_id, lignes: (d.lignes || []).map(l => ({ produitId: l.produitId, qte: l.qte })) })} className="btn bg-white border">{L('edit')}</button><button onClick={() => del(d.id)} className="btn bg-red-600 text-white">{L('delete')}</button></td></tr>)}</tbody></Table>{form && <DocModal L={L} isSales={isSales} form={form} setForm={setForm} products={products} parties={parties} save={save} close={() => setForm(null)} />}{pay && <PaymentModal L={L} pay={pay} setPay={setPay} settle={settle} close={() => setPay(null)} isSales={isSales} />}{partial && <PartialModal L={L} partial={partial} setPartial={setPartial} doPartial={doPartial} close={() => setPartial(null)} isSales={isSales} />}</>;
}

function DocModal({ L, isSales, form, setForm, products, parties, save, close }) {
  const addLine = () => setForm({ ...form, lignes: [...form.lignes, { produitId: products[0]?.id || '', qte: 1 }] });
  const updLine = (i, k, v) => setForm({ ...form, lignes: form.lignes.map((l, idx) => idx === i ? { ...l, [k]: v } : l) });
  return <Modal title={isSales ? L('sales') : L('purchases')} wide onClose={close}><label className="text-xs text-slate-500">{L('date')}<input type="date" className="input mt-1 mb-2" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label><label className="text-xs text-slate-500">{isSales ? L('customer') : L('supplier')}<select className="input mt-1 mb-2" value={form.partyId} onChange={e => setForm({ ...form, partyId: e.target.value })}>{parties.map(p => <option key={p.id} value={p.id}>{p.name || p.nom}</option>)}</select></label><div className="space-y-2">{form.lignes.map((l, i) => <div className="grid grid-cols-12 gap-2" key={i}><select className="input col-span-8" value={l.produitId} onChange={e => updLine(i, 'produitId', e.target.value)}>{products.map(p => <option key={p.id} value={p.id}>{p.nom} · {L('stock')} {p.quantite}</option>)}</select><input className="input col-span-3" type="number" value={l.qte} onChange={e => updLine(i, 'qte', e.target.value)} /><button className="btn bg-red-50 text-red-600" onClick={() => setForm({ ...form, lignes: form.lignes.filter((_, idx) => idx !== i) })}>✕</button></div>)}</div><button onClick={addLine} className="btn bg-white border mt-2">+ Ligne</button><button onClick={save} className="btn bg-amber-500 mt-4">{L('validate')}</button></Modal>;
}

function PaymentModal({ L, pay, setPay, settle, close, isSales }) {
  return <Modal title={isSales ? L('cashIn') : L('cashOut')} onClose={close}><p className="text-sm mb-2">{L('remaining')} : <b>{dh(pay.reste || 0)}</b></p><label className="text-xs text-slate-500">{L('date')}<input type="date" className="input mt-1 mb-2" value={pay.date} onChange={e => setPay({ ...pay, date: e.target.value })} /></label><label className="text-xs text-slate-500">Mode<select className="input mt-1 mb-2" value={pay.mode} onChange={e => setPay({ ...pay, mode: e.target.value })}>{['Espèces', 'Chèque', 'Virement', 'Carte', 'Effet', 'Crédit'].map(x => <option key={x}>{x}</option>)}</select></label><label className="text-xs text-slate-500">Montant<input className="input mt-1" type="number" value={pay.montant} onChange={e => setPay({ ...pay, montant: e.target.value })} /></label><button onClick={settle} className="btn bg-emerald-600 text-white mt-4">{L('validate')}</button></Modal>;
}

function PartialModal({ L, partial, setPartial, doPartial, close, isSales }) {
  return <Modal title={isSales ? L('partialDelivery') : L('partialReceipt')} onClose={close}><p className="text-sm text-slate-500 mb-3">{L('base')} : #{partial.doc.id}</p><label className="text-xs text-slate-500">{L('quantity')}<input className="input mt-1" type="number" value={partial.qte} onChange={e => setPartial({ ...partial, qte: e.target.value })} /></label><button onClick={doPartial} className="btn bg-amber-500 mt-4">{L('validate')}</button></Modal>;
}

function Payments({ L }) {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('all');
  const [err, setErr] = useState('');
  const load = () => api('/payments').then(setRows).catch(e => setErr(e.message));
  useEffect(load, []);
  if (err) return <ErrorBox msg={err} />;
  const filtered = tab === 'all' ? rows : rows.filter(x => x.type === tab);
  return <><Header title={L('payments')}><button onClick={load} className="btn bg-white border">↻</button></Header><div className="flex gap-2 mb-4"><button onClick={() => setTab('all')} className={`btn ${tab === 'all' ? 'bg-slate-800 text-white' : 'bg-white border'}`}>{L('all')}</button><button onClick={() => setTab('encaissement')} className={`btn ${tab === 'encaissement' ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>{L('cashIn')}</button><button onClick={() => setTab('decaissement')} className={`btn ${tab === 'decaissement' ? 'bg-red-600 text-white' : 'bg-white border'}`}>{L('cashOut')}</button></div><Table><thead><tr><th>{L('date')}</th><th>Type</th><th>Document</th><th>Tiers</th><th>Mode</th><th>Montant</th></tr></thead><tbody>{filtered.map((p, i) => <tr key={i}><td>{p.date}</td><td><Badge tone={p.type === 'encaissement' ? 'emerald' : 'red'}>{p.type === 'encaissement' ? L('cashIn') : L('cashOut')}</Badge></td><td>{p.docNumber || '#' + p.docId}</td><td>{p.tiers}</td><td>{p.mode}</td><td className="font-bold">{dh(p.montant)}</td></tr>)}</tbody></Table></>;
}

function SimpleList({ L, type }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api(`/${type}`).then(setRows).catch(e => setErr(e.message));
  useEffect(load, []);
  async function save() { await api(form.id ? `/${type}/${form.id}` : `/${type}`, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(form) }); setForm(null); load(); }
  async function del(id) { if (!confirm('Supprimer ?')) return; await api(`/${type}/${id}`, { method: 'DELETE' }); load(); }
  if (err) return <ErrorBox msg={err} />;
  return <><Header title={type === 'clients' ? L('clients') : L('suppliers')}><button onClick={() => setForm({ name: '', ice: '', phone: '', city: '' })} className="btn bg-amber-500">{L('new')}</button></Header><div className="grid md:grid-cols-3 gap-3">{rows.map(x => <div key={x.id} className="card p-4"><b>{x.name}</b><p className="text-sm text-slate-500">ICE: {x.ice || '-'}<br />Tél: {x.phone || '-'}<br />{x.city || ''}</p><div className="flex gap-1 mt-3"><button onClick={() => setForm(x)} className="btn bg-white border">{L('edit')}</button><button onClick={() => del(x.id)} className="btn bg-red-600 text-white">{L('delete')}</button></div></div>)}</div>{form && <Modal title={type === 'clients' ? L('clients') : L('suppliers')} onClose={() => setForm(null)}>{['name', 'ice', 'phone', 'city', 'address'].map(k => <input key={k} className="input mb-2" placeholder={k} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />)}<button onClick={save} className="btn bg-amber-500">{L('save')}</button></Modal>}</>;
}

function UsersPage({ L }) {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const load = () => Promise.all([api('/users'), api('/roles')]).then(([u, r]) => { setRows(u); setRoles(r); }).catch(e => setErr(e.message));
  useEffect(load, []);
  async function save() { await api('/users', { method: 'POST', body: JSON.stringify(form) }); setForm(null); load(); }
  if (err) return <ErrorBox msg={err} />;
  return <><Header title={L('users')}><button onClick={() => setForm({ username: '', password: 'changeme', full_name: '', role_id: roles[0]?.id })} className="btn bg-amber-500">{L('new')}</button></Header><Table><thead><tr><th>{L('username')}</th><th>{L('name')}</th><th>{L('role')}</th><th>{L('active')}</th></tr></thead><tbody>{rows.map(u => <tr key={u.id}><td>{u.username}</td><td>{u.full_name}</td><td>{u.role}</td><td>{u.active ? 'Oui' : 'Non'}</td></tr>)}</tbody></Table>{form && <Modal title={L('users')} onClose={() => setForm(null)}>{['username', 'password', 'full_name'].map(k => <input key={k} className="input mb-2" placeholder={k} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />)}<select className="input mb-3" value={form.role_id} onChange={e => setForm({ ...form, role_id: +e.target.value })}>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><button onClick={save} className="btn bg-amber-500">{L('save')}</button></Modal>}</>;
}

function Table({ children }) { return <div className="card overflow-hidden"><table className="table w-full">{children}</table></div>; }
function ErrorBox({ msg }) { return <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200"><b>Erreur :</b> {msg}</div>; }

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return <div className="min-h-screen bg-slate-100 p-8"><div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6"><h1 className="text-xl font-bold text-red-600 mb-3">Erreur de chargement DrogueriePro</h1><pre className="bg-slate-900 text-white p-4 rounded text-xs overflow-auto">{String(this.state.error?.message || this.state.error)}</pre></div></div>;
    }
    return this.props.children;
  }
}

function App() {
  const { lang, L, toggle } = useLang();

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return <div className="min-h-screen bg-slate-100 grid place-items-center p-6"><div className="bg-white rounded-2xl shadow p-6 max-w-xl"><h1 className="font-bold text-xl text-red-600 mb-3">Configuration Supabase manquante</h1><p>Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Vercel puis redéploie.</p></div></div>;
  }

  const [session, setSessionState] = useState(getSession());
  if (!session) return <Login onLogin={setSessionState} L={L} lang={lang} />;
  return <Shell session={session} setSessionState={setSessionState} lang={lang} L={L} toggle={toggle} />;
}

createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
