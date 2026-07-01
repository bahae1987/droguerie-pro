import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './index.css';

console.log('DROGUERIEPRO V11 PAYMENTS PRO OK');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseKey || 'missing-key'
);

const today = () => new Date().toISOString().slice(0, 10);
const fmt = n => (Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dh = n => fmt(n) + ' DH';

const TXT = {
  fr: {
    login: 'Connexion', username: 'Utilisateur', password: 'Mot de passe', connect: 'Se connecter',
    dashboard: 'Tableau de bord', products: 'Produits / Stock', sales: 'Ventes', purchases: 'Achats',
    payments: 'Paiements', stockMoves: 'Mouvements stock', audit: 'Journal / Traçabilité', clients: 'Clients', suppliers: 'Fournisseurs', users: 'Utilisateurs', permissions: 'Autorisations',
    logout: 'Déconnexion', lang: 'العربية', new: 'Nouveau', save: 'Enregistrer', edit: 'Modifier',
    del: 'Supprimer', actions: 'Actions', stock: 'Stock', price: 'Prix', create: 'Créer',
    direct: 'Direct', advance: 'Avancer', pay: 'Régler', cashRegister: 'Caisse', receiptNo: 'N° reçu', chequeNo: 'N° chèque', bank: 'Banque', dueDate: 'Échéance', paymentStatus: 'Statut', transferRef: 'Réf. virement', valueDate: 'Date valeur', terminal: 'TPE', transactionNo: 'N° transaction', billNo: 'N° effet', note: 'Observation', partialDelivery: 'Livraison partielle',
    partialReceipt: 'Réception partielle', all: 'Tous', quotes: 'Devis', orders: 'Commandes',
    deliveries: 'Livraisons', receipts: 'Réceptions', invoices: 'Factures', remaining: 'Reste',
    paid: 'Réglée', unpaid: 'Non réglée', partial: 'Partielle', cashIn: 'Encaissements',
    cashOut: 'Décaissements', quantity: 'Quantité', date: 'Date', customer: 'Client',
    supplier: 'Fournisseur', product: 'Produit', base: 'Base'
  },
  ar: {
    login: 'تسجيل الدخول', username: 'المستخدم', password: 'كلمة المرور', connect: 'دخول',
    dashboard: 'لوحة القيادة', products: 'المنتجات / المخزون', sales: 'المبيعات', purchases: 'المشتريات',
    payments: 'الأداءات', stockMoves: 'حركات المخزون', audit: 'سجل التتبع', clients: 'الزبناء', suppliers: 'الموردون', users: 'المستخدمون', permissions: 'الصلاحيات',
    logout: 'خروج', lang: 'Français', new: 'جديد', save: 'حفظ', edit: 'تعديل',
    del: 'حذف', actions: 'الإجراءات', stock: 'المخزون', price: 'الثمن', create: 'إنشاء',
    direct: 'مباشر', advance: 'المرحلة التالية', pay: 'تسوية', cashRegister: 'الصندوق', receiptNo: 'رقم الوصل', chequeNo: 'رقم الشيك', bank: 'البنك', dueDate: 'تاريخ الاستحقاق', paymentStatus: 'الحالة', transferRef: 'مرجع التحويل', valueDate: 'تاريخ القيمة', terminal: 'جهاز الأداء', transactionNo: 'رقم العملية', billNo: 'رقم الكمبيالة', note: 'ملاحظة', partialDelivery: 'تسليم جزئي',
    partialReceipt: 'استلام جزئي', all: 'الكل', quotes: 'العروض', orders: 'الطلبيات',
    deliveries: 'التسليمات', receipts: 'الاستلامات', invoices: 'الفواتير', remaining: 'الباقي',
    paid: 'مؤداة', unpaid: 'غير مؤداة', partial: 'جزئية', cashIn: 'المداخيل',
    cashOut: 'المصاريف', quantity: 'الكمية', date: 'التاريخ', customer: 'الزبون',
    supplier: 'المورد', product: 'المنتج', base: 'الأصل'
  }
};

const PERMS = [
  'dashboard.read', 'products.read', 'products.write', 'products.delete',
  'clients.read', 'clients.write', 'clients.delete',
  'suppliers.read', 'suppliers.write', 'suppliers.delete',
  'sales.read', 'sales.write', 'sales.delete',
  'purchases.read', 'purchases.write', 'purchases.delete',
  'users.read', 'users.write'
];


function normalizePerms(perms) {
  return Array.isArray(perms) ? perms : [];
}

function hasPerm(session, code) {
  return normalizePerms(session?.perms).includes(code);
}

async function getUserPermissions(userId) {
  const { data: user, error: uErr } = await supabase
    .from('users')
    .select('id, role_id')
    .eq('id', userId)
    .single();

  if (uErr) throw new Error(uErr.message);

  const { data: rolePerms, error: rpErr } = await supabase
    .from('role_permissions')
    .select('permissions(code)')
    .eq('role_id', user.role_id);

  if (rpErr) throw new Error(rpErr.message);

  const perms = (rolePerms || []).map(x => x.permissions?.code).filter(Boolean);
  return perms.length ? perms : PERMS;
}

async function loadPermissionsMatrix() {
  const [{ data: roles, error: rErr }, { data: permissions, error: pErr }, { data: rolePerms, error: rpErr }] = await Promise.all([
    supabase.from('roles').select('*').order('id'),
    supabase.from('permissions').select('*').order('module').order('code'),
    supabase.from('role_permissions').select('*')
  ]);

  if (rErr) throw new Error(rErr.message);
  if (pErr) throw new Error(pErr.message);
  if (rpErr) throw new Error(rpErr.message);

  return { roles: roles || [], permissions: permissions || [], rolePerms: rolePerms || [] };
}

async function setRolePermission(roleId, permissionId, enabled) {
  if (enabled) {
    const { error } = await supabase
      .from('role_permissions')
      .upsert({ role_id: roleId, permission_id: permissionId }, { onConflict: 'role_id,permission_id' });
    if (error) throw new Error(error.message);
    await auditLog('Autorisations', 'GRANT', 'role #' + roleId, 'Ajout permission #' + permissionId);
  } else {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);
    if (error) throw new Error(error.message);
    await auditLog('Autorisations', 'REVOKE', 'role #' + roleId, 'Retrait permission #' + permissionId);
  }
}


function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem('droguerie_session') || 'null');
  } catch {
    return null;
  }
}

function setStoredSession(s) {
  localStorage.setItem('droguerie_session', JSON.stringify(s));
}

function clearStoredSession() {
  localStorage.removeItem('droguerie_session');
}

function jsonValue(v, fallback) {
  if (!v) return fallback;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return fallback; }
  }
  return v;
}

function paymentInfo(doc) {
  const payments = jsonValue(doc.payments_json || doc.paiements, []);
  const paid = payments.reduce((s, p) => s + Number(p.montant || 0), 0);
  const total = Number(doc.total_ttc || doc.totalTTC || 0);
  const rest = Math.max(0, total - paid);
  const status = paid <= 0.001 ? 'unpaid' : rest <= 0.01 ? 'paid' : 'partial';
  return { paid, rest, status };
}

function mapProduct(p) {
  return {
    id: p.id,
    ref: p.ref || '',
    nom: p.name || '',
    categorie: p.category || '',
    unite: p.unit || '',
    prixAchat: Number(p.purchase_price || 0),
    prixVente: Number(p.sale_price || 0),
    quantite: Number(p.quantity || 0),
    stockMin: Number(p.min_stock || 0),
    fournisseurId: p.supplier_id
  };
}

function mapDoc(d) {
  const pay = paymentInfo(d);
  return {
    ...d,
    numeros: jsonValue(d.numbers_json, {}),
    lignes: jsonValue(d.lines_json, []),
    paiements: jsonValue(d.payments_json, []),
    totalTTC: Number(d.total_ttc || 0),
    totalHT: Number(d.total_ht || 0),
    tva: Number(d.vat || 0),
    reste: pay.rest,
    statutPaiement: pay.status,
    baseDocId: d.base_doc_id || null
  };
}

function computeTotals(lines, vatRate, salesMode) {
  const base = lines.reduce((s, l) => s + Number(l.prixUnit || 0) * Number(l.qte || 0), 0);
  if (salesMode) {
    const totalTTC = base;
    const totalHT = totalTTC / (1 + vatRate / 100);
    return { totalHT, vat: totalTTC - totalHT, totalTTC };
  }
  const totalHT = base;
  return { totalHT, vat: totalHT * vatRate / 100, totalTTC: totalHT * (1 + vatRate / 100) };
}

async function nextNumber(prefix) {
  const { data } = await supabase.from('counters').select('value').eq('name', prefix).maybeSingle();
  const value = Number(data?.value || 1);
  const { error } = await supabase.from('counters').upsert({ name: prefix, value: value + 1 }, { onConflict: 'name' });
  if (error) throw new Error(error.message);
  return prefix + '-' + new Date().getFullYear() + '-' + String(value).padStart(4, '0');
}

async function updateStock(lines, sign, reason) {
  for (const line of lines) {
    const productId = Number(line.produitId || line.product_id || line.id);
    const qty = Number(line.qte || line.quantity || 0);
    if (!productId || !qty) continue;

    const { data: product, error: readError } = await supabase.from('products').select('quantity').eq('id', productId).single();
    if (readError) throw new Error(readError.message);

    const newQty = Number(product.quantity || 0) + qty * sign;

    const { error: updateError } = await supabase.from('products').update({ quantity: newQty }).eq('id', productId);
    if (updateError) throw new Error(updateError.message);

    await supabase.from('stock_movements').insert({
      product_id: productId,
      quantity: qty * sign,
      reason,
      created_at: new Date().toISOString()
    });
  }
}

async function login(username, password) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, full_name, password_hash, active, roles(name)')
    .eq('username', username)
    .eq('active', true)
    .single();

  if (error || !data) throw new Error('Identifiant incorrect');
  if (password !== data.password_hash) throw new Error('Mot de passe incorrect');

  const dbPerms = await getUserPermissions(data.id);

  return {
    user: {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      role: data.roles?.name || 'Administrateur'
    },
    perms: dbPerms
  };
}

function App() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'fr');
  const [session, setSession] = useState(getStoredSession());
  const L = key => TXT[lang]?.[key] || key;

  function toggleLang() {
    const next = lang === 'fr' ? 'ar' : 'fr';
    localStorage.setItem('lang', next);
    setLang(next);
  }

  if (!supabaseUrl || !supabaseKey) {
    return <ConfigMissing />;
  }

  if (!session) {
    return <LoginPage L={L} lang={lang} onLogin={s => { setStoredSession(s); setSession(s); }} />;
  }

  return <Layout L={L} lang={lang} toggleLang={toggleLang} session={session} setSession={setSession} />;
}

function ConfigMissing() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-6">
      <div className="card p-6 max-w-xl">
        <h1 className="text-xl font-bold text-red-600 mb-3">Configuration Supabase manquante</h1>
        <p>Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Vercel, puis redéploie.</p>
      </div>
    </div>
  );
}



function currentUserLabel() {
  const s = getStoredSession();
  return s?.user?.full_name || s?.user?.username || 'system';
}

async function auditLog(moduleName, action, objectLabel, detail) {
  try {
    const s = getStoredSession();
    await supabase.from('audit_logs').insert({
      module: moduleName,
      action,
      object_label: objectLabel || '',
      detail: detail || '',
      user_id: s?.user?.id || null,
      user_label: currentUserLabel(),
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Audit log error:', e.message);
  }
}

async function loadAuditLogs() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return data || [];
}

async function loadStockMovements() {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('id, product_id, quantity, reason, created_at, products(ref, name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(m => ({
    id: m.id,
    productId: m.product_id,
    ref: m.products?.ref || '',
    productName: m.products?.name || '',
    quantity: Number(m.quantity || 0),
    reason: m.reason || '',
    date: m.created_at
  }));
}

function LoginPage({ L, lang, onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const s = await login(username, password);
      onLogin(s);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className={'min-h-screen bg-slate-900 grid place-items-center ' + (lang === 'ar' ? 'rtl' : '')}>
      <form onSubmit={submit} className="bg-white p-7 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <span className="bg-amber-500 rounded-xl w-12 h-12 grid place-items-center font-black">DP</span>
          <div>
            <h1 className="font-bold text-xl">DrogueriePro</h1>
            <p className="text-xs text-slate-400">{L('login')}</p>
          </div>
        </div>

        {err ? <p className="bg-red-50 text-red-600 p-2 rounded mb-3">{err}</p> : null}

        <label className="text-xs text-slate-500">{L('username')}</label>
        <input className="input mb-3" value={username} onChange={e => setUsername(e.target.value)} />

        <label className="text-xs text-slate-500">{L('password')}</label>
        <input className="input mb-4" type="password" value={password} onChange={e => setPassword(e.target.value)} />

        <button className="btn bg-amber-500 w-full">{L('connect')}</button>
      </form>
    </div>
  );
}

function Layout({ L, lang, toggleLang, session, setSession }) {
  const [page, setPage] = useState('dashboard');

  const menu = [
    ['dashboard', L('dashboard'), 'dashboard.read'],
    ['products', L('products'), 'products.read'],
    ['sales', L('sales'), 'sales.read'],
    ['purchases', L('purchases'), 'purchases.read'],
    ['payments', L('payments'), 'payments.read'],
    ['stockMoves', L('stockMoves'), 'stock.read'],
    ['audit', L('audit'), 'audit.read'],
    ['clients', L('clients'), 'clients.read'],
    ['suppliers', L('suppliers'), 'suppliers.read'],
    ['users', L('users'), 'users.read'],
    ['permissions', L('permissions'), 'permissions.manage']
  ].filter(item => hasPerm(session, item[2]));

  return (
    <div className={lang === 'ar' ? 'rtl' : ''}>
      <div className="min-h-screen flex">
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
          <div className="p-5 border-b border-slate-800">
            <div className="font-bold text-white text-xl">Droguerie<span className="text-amber-500">Pro</span></div>
            <div className="text-xs text-slate-500">{session.user?.full_name} · {session.user?.role}</div>
          </div>

          <nav className="p-3 flex-1 space-y-1">
            {menu.map(item => (
              <button
                key={item[0]}
                onClick={() => setPage(item[0])}
                className={'w-full text-left px-3 py-2.5 rounded-lg text-sm ' + (page === item[0] ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-slate-800')}
              >
                {item[1]}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-800 space-y-2">
            <button onClick={toggleLang} className="btn bg-slate-800 w-full">{L('lang')}</button>
            <button onClick={() => { clearStoredSession(); setSession(null); }} className="btn bg-slate-800 w-full">{L('logout')}</button>
          </div>
        </aside>

        <main className="flex-1 p-6 max-w-[1500px] mx-auto w-full">
          {page === 'dashboard' ? <Dashboard L={L} /> : null}
          {page === 'products' ? <Products L={L} session={session} /> : null}
          {page === 'sales' ? <Docs L={L} type="sales" session={session} /> : null}
          {page === 'purchases' ? <Docs L={L} type="purchases" session={session} /> : null}
          {page === 'payments' ? <Payments L={L} session={session} /> : null}
          {page === 'stockMoves' ? <StockMovements L={L} /> : null}
          {page === 'audit' ? <AuditLog L={L} /> : null}
          {page === 'clients' ? <Parties L={L} type="clients" session={session} /> : null}
          {page === 'suppliers' ? <Parties L={L} type="suppliers" session={session} /> : null}
          {page === 'users' ? <Users L={L} session={session} /> : null}
          {page === 'permissions' ? <Permissions L={L} /> : null}
        </main>
      </div>
    </div>
  );
}

function Header({ title, children }) {
  return (
    <div className="flex justify-between items-end mb-5">
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function Table({ children }) {
  return <div className="card overflow-hidden"><table className="table w-full">{children}</table></div>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 grid place-items-center p-4 overflow-auto">
      <div className={'bg-white rounded-2xl shadow-2xl w-full p-5 ' + (wide ? 'max-w-4xl' : 'max-w-lg')}>
        <div className="flex justify-between mb-4">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Badge({ children, tone }) {
  const tones = {
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-sky-100 text-sky-700',
    slate: 'bg-slate-100 text-slate-700'
  };
  return <span className={'px-2 py-1 rounded text-xs font-semibold ' + (tones[tone] || tones.slate)}>{children}</span>;
}

function ErrorBox({ msg }) {
  return <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl"><b>Erreur :</b> {msg}</div>;
}

function Dashboard({ L }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {
      setErr('');
      const [{ data: products }, { data: sales }, { data: purchases }] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('purchases').select('*')
      ]);

      const factures = (sales || []).filter(x => x.stage === 'facture');
      const factAch = (purchases || []).filter(x => x.stage === 'facture');

      setData({
        products: products?.length || 0,
        lowStock: products?.filter(p => Number(p.quantity) <= Number(p.min_stock)).length || 0,
        stockValue: products?.reduce((s, p) => s + Number(p.quantity || 0) * Number(p.purchase_price || 0), 0) || 0,
        ca: factures.reduce((s, x) => s + Number(x.total_ttc || 0), 0),
        dettes: factAch.reduce((s, x) => s + paymentInfo(x).rest, 0)
      });
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, []);

  if (err) return <ErrorBox msg={err} />;
  if (!data) return <p>Chargement...</p>;

  const cards = [
    [L('sales'), dh(data.ca)],
    [L('stock'), dh(data.stockValue)],
    [L('products'), data.products],
    ['Alertes', data.lowStock],
    ['Dettes', dh(data.dettes)]
  ];

  return (
    <>
      <Header title={L('dashboard')}><button onClick={load} className="btn bg-white border">↻</button></Header>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {cards.map(c => <div key={c[0]} className="card p-5"><p className="text-xs text-slate-400">{c[0]}</p><p className="text-2xl font-black mt-2 font-mono">{c[1]}</p></div>)}
      </div>
    </>
  );
}

function Products({ L, session }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [stock, setStock] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      setRows((data || []).map(mapProduct));
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    try {
      const payload = {
        ref: form.ref || '',
        name: form.nom || '',
        category: form.categorie || 'Divers',
        unit: form.unite || 'Pièce',
        purchase_price: Number(form.prixAchat || 0),
        sale_price: Number(form.prixVente || 0),
        quantity: Number(form.quantite || 0),
        min_stock: Number(form.stockMin || 0),
        supplier_id: form.fournisseurId || null
      };

      const q = form.id ? supabase.from('products').update(payload).eq('id', form.id) : supabase.from('products').insert(payload);
      const { error } = await q;
      if (error) throw error;
      await auditLog('Produits', form.id ? 'UPDATE' : 'CREATE', form.nom || form.ref, form.id ? 'Modification produit' : 'Création produit');
      setForm(null);
      load();
    } catch (e) { alert(e.message); }
  }

  async function remove(id) {
    if (!confirm('Supprimer ?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert(error.message);
    else await auditLog('Produits', 'DELETE', String(id), 'Suppression produit');
    load();
  }

  async function adjustStock() {
    try {
      await updateStock([{ produitId: stock.id, qte: Number(stock.qte) }], 1, stock.reason || L('stock'));
      await auditLog('Stock', 'STOCK', stock.nom, 'Ajustement stock : ' + stock.qte + ' - ' + (stock.reason || ''));
      setStock(null);
      load();
    } catch (e) { alert(e.message); }
  }

  if (err) return <ErrorBox msg={err} />;

  return (
    <>
      <Header title={L('products')}>
        {hasPerm(session, 'products.write') ? <button onClick={() => setForm({ ref: '', nom: '', categorie: 'Divers', unite: 'Pièce', prixAchat: 0, prixVente: 0, quantite: 0, stockMin: 0 })} className="btn bg-amber-500">{L('new')}</button> : null}
      </Header>

      <Table>
        <thead><tr><th>{L('ref')}</th><th>{L('name')}</th><th>{L('category')}</th><th>{L('stock')}</th><th>{L('price')}</th><th>{L('actions')}</th></tr></thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.id}>
              <td className="font-mono text-xs">{p.ref}</td>
              <td className="font-semibold">{p.nom}</td>
              <td>{p.categorie}</td>
              <td className={p.quantite <= p.stockMin ? 'text-red-600 font-bold' : ''}>{p.quantite} {p.unite}</td>
              <td>{dh(p.prixVente)}</td>
              <td className="flex gap-1">
                {hasPerm(session, 'products.write') ? <button onClick={() => setForm(p)} className="btn bg-white border">{L('edit')}</button> : null}
                {hasPerm(session, 'stock.adjust') ? <button onClick={() => setStock({ ...p, qte: 1, reason: L('stock') })} className="btn bg-white border">{L('stock')}</button> : null}
                {hasPerm(session, 'products.delete') ? <button onClick={() => remove(p.id)} className="btn bg-red-600 text-white">{L('del')}</button> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {form ? <ProductModal L={L} form={form} setForm={setForm} save={save} close={() => setForm(null)} /> : null}
      {stock ? <StockModal L={L} stock={stock} setStock={setStock} save={adjustStock} close={() => setStock(null)} /> : null}
    </>
  );
}

function ProductModal({ L, form, setForm, save, close }) {
  const fields = [
    ['ref', L('ref')], ['nom', L('name')], ['categorie', L('category')], ['unite', 'Unité'],
    ['prixAchat', 'Prix achat'], ['prixVente', 'Prix vente'], ['quantite', L('quantity')], ['stockMin', 'Seuil']
  ];
  return (
    <Modal title={L('products')} onClose={close}>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(([k, label]) => (
          <label key={k} className="text-xs text-slate-500">
            {label}
            <input className="input mt-1" value={form[k] ?? ''} onChange={e => setForm({ ...form, [k]: ['prixAchat', 'prixVente', 'quantite', 'stockMin'].includes(k) ? Number(e.target.value) : e.target.value })} />
          </label>
        ))}
      </div>
      <button onClick={save} className="btn bg-amber-500 mt-4">{L('save')}</button>
    </Modal>
  );
}

function StockModal({ L, stock, setStock, save, close }) {
  return (
    <Modal title={L('stock')} onClose={close}>
      <p className="font-semibold mb-3">{stock.nom}</p>
      <label className="text-xs text-slate-500">{L('quantity')} (+ / -)
        <input className="input mt-1 mb-2" type="number" value={stock.qte} onChange={e => setStock({ ...stock, qte: e.target.value })} />
      </label>
      <label className="text-xs text-slate-500">Motif
        <input className="input mt-1" value={stock.reason} onChange={e => setStock({ ...stock, reason: e.target.value })} />
      </label>
      <button onClick={save} className="btn bg-amber-500 mt-4">{L('save')}</button>
    </Modal>
  );
}

function Docs({ L, type, session }) {
  const isSales = type === 'sales';
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [parties, setParties] = useState([]);
  const [form, setForm] = useState(null);
  const [pay, setPay] = useState(null);
  const [partial, setPartial] = useState(null);
  const [tab, setTab] = useState('all');
  const [err, setErr] = useState('');

  async function load() {
    try {
      const [{ data: docs, error: dErr }, { data: prod, error: pErr }, { data: party, error: tErr }] = await Promise.all([
        supabase.from(type).select('*').order('id', { ascending: false }),
        supabase.from('products').select('*').order('name'),
        supabase.from(isSales ? 'clients' : 'suppliers').select('*').order('name')
      ]);
      if (dErr) throw dErr;
      if (pErr) throw pErr;
      if (tErr) throw tErr;
      setRows((docs || []).map(mapDoc));
      setProducts((prod || []).map(mapProduct));
      setParties(party || []);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, [type]);

  const tabs = isSales
    ? [['all', L('all')], ['devis', L('quotes')], ['commande', L('orders')], ['livraison', L('deliveries')], ['facture', L('invoices')]]
    : [['all', L('all')], ['commande', L('orders')], ['reception', L('receipts')], ['facture', L('invoices')]];

  const filtered = tab === 'all' ? rows : rows.filter(x => x.stage === tab);

  function create(start) {
    setForm({ start, date: today(), partyId: parties[0]?.id || '', lignes: [{ produitId: products[0]?.id || '', qte: 1 }] });
  }

  async function save() {
    try {
      const lines = form.lignes.map(l => {
        const product = products.find(p => String(p.id) === String(l.produitId));
        if (!product) throw new Error('Produit non sélectionné');
        return {
          produitId: product.id,
          ref: product.ref,
          nom: product.nom,
          prixUnit: isSales ? product.prixVente : product.prixAchat,
          qte: Number(l.qte)
        };
      });
      const party = parties.find(p => String(p.id) === String(form.partyId));
      if (!party) throw new Error(isSales ? 'Client non sélectionné' : 'Fournisseur non sélectionné');

      const body = {
        start: form.start,
        date: form.date,
        lignes: lines,
        tauxTva: 20,
        clientId: party.id,
        clientNom: party.name,
        fournisseurId: party.id,
        fournisseurNom: party.name
      };

      if (form.id) await updateDoc(type, form.id, body);
      else await createDoc(type, body);

      setForm(null);
      load();
    } catch (e) { alert(e.message); }
  }

  async function advance(id) {
    try { await advanceDoc(type, id); load(); }
    catch (e) { alert(e.message); }
  }

  async function remove(id) {
    if (!confirm('Supprimer ?')) return;
    try { await deleteDoc(type, id); load(); }
    catch (e) { alert(e.message); }
  }

  async function settle() {
    try {
      await payDoc(type, pay.id, {
        date: pay.date,
        mode: pay.mode,
        montant: Number(pay.montant),
        cashRegister: pay.cashRegister,
        receiptNo: pay.receiptNo,
        chequeNo: pay.chequeNo,
        bank: pay.bank,
        dueDate: pay.dueDate,
        paymentStatus: pay.paymentStatus,
        transferRef: pay.transferRef,
        valueDate: pay.valueDate,
        terminal: pay.terminal,
        transactionNo: pay.transactionNo,
        billNo: pay.billNo,
        note: pay.note
      });
      setPay(null);
      load();
    } catch (e) { alert(e.message); }
  }

  async function doPartial() {
    try {
      await partialDoc(type, partial.doc.id, { qte: Number(partial.qte) });
      setPartial(null);
      load();
    } catch (e) { alert(e.message); }
  }

  if (err) return <ErrorBox msg={err} />;

  return (
    <>
      <Header title={isSales ? L('sales') : L('purchases')}>
        {hasPerm(session, isSales ? 'sales.write' : 'purchases.write') ? <button onClick={() => create(isSales ? 'devis' : 'commande')} className="btn bg-white border">{L('create')}</button> : null}
        {hasPerm(session, isSales ? 'sales.write' : 'purchases.write') ? <button onClick={() => create(isSales ? 'facture' : 'reception')} className="btn bg-amber-500">{L('direct')}</button> : null}
      </Header>

      <div className="flex gap-1 mb-4 flex-wrap">
        {tabs.map(t => <button key={t[0]} onClick={() => setTab(t[0])} className={'px-3 py-1.5 rounded-lg text-sm ' + (tab === t[0] ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500')}>{t[1]}</button>)}
      </div>

      <Table>
        <thead>
          <tr><th>N°</th><th>{L('base')}</th><th>{L('date')}</th><th>{isSales ? L('customer') : L('supplier')}</th><th>{L('status')}</th><th>{L('total')}</th><th>{L('payment')}</th><th>{L('actions')}</th></tr>
        </thead>
        <tbody>
          {filtered.map(d => {
            const status = d.statutPaiement === 'paid' ? L('paid') : d.statutPaiement === 'partial' ? L('partial') : L('unpaid');
            const tone = d.statutPaiement === 'paid' ? 'green' : d.statutPaiement === 'partial' ? 'amber' : 'red';
            return (
              <tr key={d.id}>
                <td className="font-mono text-xs">{Object.values(d.numeros || {})[0] || '#' + d.id}</td>
                <td>{d.baseDocId ? <Badge tone="blue">#{d.baseDocId}</Badge> : '-'}</td>
                <td>{d.date}</td>
                <td>{d.client_name || d.supplier_name || d.clientNom || d.fournisseurNom}</td>
                <td><Badge tone="blue">{d.stage}</Badge></td>
                <td>{dh(d.totalTTC)}</td>
                <td><Badge tone={tone}>{status}{d.reste > 0 ? ' · ' + L('remaining') + ' ' + dh(d.reste) : ''}</Badge></td>
                <td className="flex gap-1 flex-wrap">
                  {hasPerm(session, isSales ? 'sales.write' : 'purchases.write') ? <button onClick={() => advance(d.id)} className="btn bg-slate-800 text-white">{L('advance')}</button> : null}
                  {hasPerm(session, isSales ? 'sales.pay' : 'purchases.pay') ? <button onClick={() => setPay({ ...d, date: today(), mode: 'Espèces', montant: d.reste || d.totalTTC, cashRegister: '', receiptNo: '', chequeNo: '', bank: '', dueDate: '', paymentStatus: 'En portefeuille', transferRef: '', valueDate: '', terminal: '', transactionNo: '', billNo: '', note: '' })} className="btn bg-emerald-600 text-white">{L('pay')}</button> : null}
                  {d.stage !== 'facture' && hasPerm(session, isSales ? 'sales.write' : 'purchases.write') ? <button onClick={() => setPartial({ doc: d, qte: d.lignes?.[0]?.qte || 1 })} className="btn bg-white border">{isSales ? L('partialDelivery') : L('partialReceipt')}</button> : null}
                  {hasPerm(session, isSales ? 'sales.write' : 'purchases.write') ? <button onClick={() => setForm({ id: d.id, start: d.stage, date: d.date, partyId: isSales ? d.client_id : d.supplier_id, lignes: (d.lignes || []).map(l => ({ produitId: l.produitId, qte: l.qte })) })} className="btn bg-white border">{L('edit')}</button> : null}
                  {hasPerm(session, isSales ? 'sales.delete' : 'purchases.delete') ? <button onClick={() => remove(d.id)} className="btn bg-red-600 text-white">{L('del')}</button> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {form ? <DocModal L={L} isSales={isSales} form={form} setForm={setForm} products={products} parties={parties} save={save} close={() => setForm(null)} /> : null}
      {pay ? <PaymentModal L={L} isSales={isSales} pay={pay} setPay={setPay} save={settle} close={() => setPay(null)} /> : null}
      {partial ? <PartialModal L={L} isSales={isSales} partial={partial} setPartial={setPartial} save={doPartial} close={() => setPartial(null)} /> : null}
    </>
  );
}

function DocModal({ L, isSales, form, setForm, products, parties, save, close }) {
  function addLine() { setForm({ ...form, lignes: [...form.lignes, { produitId: products[0]?.id || '', qte: 1 }] }); }
  function updateLine(i, k, v) { setForm({ ...form, lignes: form.lignes.map((l, idx) => idx === i ? { ...l, [k]: v } : l) }); }

  return (
    <Modal title={isSales ? L('sales') : L('purchases')} onClose={close} wide>
      <label className="text-xs text-slate-500">{L('date')}
        <input type="date" className="input mt-1 mb-2" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      </label>
      <label className="text-xs text-slate-500">{isSales ? L('customer') : L('supplier')}
        <select className="input mt-1 mb-2" value={form.partyId} onChange={e => setForm({ ...form, partyId: e.target.value })}>
          {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>

      <div className="space-y-2">
        {form.lignes.map((l, i) => (
          <div className="grid grid-cols-12 gap-2" key={i}>
            <select className="input col-span-8" value={l.produitId} onChange={e => updateLine(i, 'produitId', e.target.value)}>
              {products.map(p => <option key={p.id} value={p.id}>{p.nom} · {L('stock')} {p.quantite}</option>)}
            </select>
            <input className="input col-span-3" type="number" value={l.qte} onChange={e => updateLine(i, 'qte', e.target.value)} />
            <button className="btn bg-red-50 text-red-600" onClick={() => setForm({ ...form, lignes: form.lignes.filter((_, idx) => idx !== i) })}>✕</button>
          </div>
        ))}
      </div>

      <button onClick={addLine} className="btn bg-white border mt-2">+ Ligne</button>
      <button onClick={save} className="btn bg-amber-500 mt-4">{L('save')}</button>
    </Modal>
  );
}

function PaymentModal({ L, isSales, pay, setPay, save, close }) {
  const mode = pay.mode || 'Espèces';

  function Field({ label, name, type = 'text' }) {
    return (
      <label className="text-xs text-slate-500">
        {label}
        <input
          type={type}
          className="input mt-1 mb-2"
          value={pay[name] || ''}
          onChange={e => setPay({ ...pay, [name]: e.target.value })}
        />
      </label>
    );
  }

  function SelectField({ label, name, options }) {
    return (
      <label className="text-xs text-slate-500">
        {label}
        <select className="input mt-1 mb-2" value={pay[name] || ''} onChange={e => setPay({ ...pay, [name]: e.target.value })}>
          {options.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </label>
    );
  }

  return (
    <Modal title={isSales ? L('cashIn') : L('cashOut')} onClose={close}>
      <p className="text-sm mb-2">{L('remaining')} : <b>{dh(pay.reste || 0)}</b></p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label={L('date')} name="date" type="date" />

        <label className="text-xs text-slate-500">
          Mode
          <select className="input mt-1 mb-2" value={mode} onChange={e => setPay({ ...pay, mode: e.target.value })}>
            {['Espèces', 'Chèque', 'Virement', 'Carte', 'Effet', 'Crédit'].map(x => <option key={x}>{x}</option>)}
          </select>
        </label>

        <Field label="Montant" name="montant" type="number" />

        {mode === 'Espèces' && (
          <>
            <Field label={L('cashRegister')} name="cashRegister" />
            <Field label={L('receiptNo')} name="receiptNo" />
          </>
        )}

        {mode === 'Chèque' && (
          <>
            <Field label={L('chequeNo')} name="chequeNo" />
            <Field label={L('bank')} name="bank" />
            <Field label={L('dueDate')} name="dueDate" type="date" />
            <SelectField label={L('paymentStatus')} name="paymentStatus" options={['En portefeuille', 'Déposé', 'Encaissé', 'Rejeté']} />
          </>
        )}

        {mode === 'Virement' && (
          <>
            <Field label={L('bank')} name="bank" />
            <Field label={L('transferRef')} name="transferRef" />
            <Field label={L('valueDate')} name="valueDate" type="date" />
          </>
        )}

        {mode === 'Carte' && (
          <>
            <Field label={L('terminal')} name="terminal" />
            <Field label={L('transactionNo')} name="transactionNo" />
          </>
        )}

        {mode === 'Effet' && (
          <>
            <Field label={L('billNo')} name="billNo" />
            <Field label={L('bank')} name="bank" />
            <Field label={L('dueDate')} name="dueDate" type="date" />
            <SelectField label={L('paymentStatus')} name="paymentStatus" options={['En portefeuille', 'Déposé', 'Encaissé', 'Rejeté']} />
          </>
        )}

        {mode === 'Crédit' && (
          <>
            <Field label={L('dueDate')} name="dueDate" type="date" />
            <Field label={L('note')} name="note" />
          </>
        )}
      </div>

      <label className="text-xs text-slate-500">
        {L('note')}
        <textarea
          className="input mt-1"
          value={pay.note || ''}
          onChange={e => setPay({ ...pay, note: e.target.value })}
        />
      </label>

      <button onClick={save} className="btn bg-emerald-600 text-white mt-4">{L('save')}</button>
    </Modal>
  );
}

function PartialModal({ L, isSales, partial, setPartial, save, close }) {
  return (
    <Modal title={isSales ? L('partialDelivery') : L('partialReceipt')} onClose={close}>
      <p className="text-sm text-slate-500 mb-3">{L('base')} : #{partial.doc.id}</p>
      <label className="text-xs text-slate-500">{L('quantity')}
        <input type="number" className="input mt-1" value={partial.qte} onChange={e => setPartial({ ...partial, qte: e.target.value })} />
      </label>
      <button onClick={save} className="btn bg-amber-500 mt-4">{L('save')}</button>
    </Modal>
  );
}

function Payments({ L, session }) {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('all');
  const [err, setErr] = useState('');

  async function load() {
    try {
      const rows = await loadPayments();
      setRows(rows);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, []);

  if (err) return <ErrorBox msg={err} />;

  const filtered = tab === 'all' ? rows : rows.filter(x => x.type === tab);

  return (
    <>
      <Header title={L('payments')}><button onClick={load} className="btn bg-white border">↻</button></Header>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('all')} className={'btn ' + (tab === 'all' ? 'bg-slate-800 text-white' : 'bg-white border')}>{L('all')}</button>
        <button onClick={() => setTab('encaissement')} className={'btn ' + (tab === 'encaissement' ? 'bg-emerald-600 text-white' : 'bg-white border')}>{L('cashIn')}</button>
        <button onClick={() => setTab('decaissement')} className={'btn ' + (tab === 'decaissement' ? 'bg-red-600 text-white' : 'bg-white border')}>{L('cashOut')}</button>
      </div>

      <Table>
        <thead><tr><th>{L('date')}</th><th>Type</th><th>Document</th><th>Tiers</th><th>Mode</th><th>Détails</th><th>Montant</th></tr></thead>
        <tbody>
          {filtered.map((p, i) => (
            <tr key={i}>
              <td>{p.date}</td>
              <td><Badge tone={p.type === 'encaissement' ? 'green' : 'red'}>{p.type === 'encaissement' ? L('cashIn') : L('cashOut')}</Badge></td>
              <td>{p.docNumber || '#' + p.docId}</td>
              <td>{p.tiers}</td>
              <td>{p.mode}</td>
              <td className="text-xs text-slate-500">
                {p.chequeNo ? 'Chèque: ' + p.chequeNo + ' · ' : ''}
                {p.billNo ? 'Effet: ' + p.billNo + ' · ' : ''}
                {p.bank ? p.bank + ' · ' : ''}
                {p.transferRef ? 'Vir: ' + p.transferRef + ' · ' : ''}
                {p.transactionNo ? 'Tx: ' + p.transactionNo + ' · ' : ''}
                {p.paymentStatus || p.receiptNo || p.cashRegister || p.note || '-'}
              </td>
              <td className="font-bold">{dh(p.montant)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}



function AuditLog({ L }) {
  const [rows, setRows] = useState([]);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [err, setErr] = useState('');

  async function load() {
    try {
      setErr('');
      const data = await loadAuditLogs();
      setRows(data);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  if (err) return <ErrorBox msg={err} />;

  const modules = ['all', ...Array.from(new Set(rows.map(x => x.module).filter(Boolean)))];
  const actions = ['all', ...Array.from(new Set(rows.map(x => x.action).filter(Boolean)))];

  const filtered = rows.filter(x =>
    (moduleFilter === 'all' || x.module === moduleFilter) &&
    (actionFilter === 'all' || x.action === actionFilter)
  );

  function tone(action) {
    if (['CREATE', 'ADVANCE', 'PAYMENT', 'STOCK', 'PARTIAL_RECEIPT'].includes(action)) return 'green';
    if (['DELETE'].includes(action)) return 'red';
    if (['UPDATE', 'PARTIAL_DELIVERY'].includes(action)) return 'amber';
    return 'blue';
  }

  return (
    <>
      <Header title={L('audit')}>
        <button onClick={load} className="btn bg-white border">↻</button>
      </Header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="card p-4">
          <p className="text-xs text-slate-400">{L('movement')}</p>
          <p className="text-2xl font-black">{rows.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400">CREATE</p>
          <p className="text-2xl font-black text-emerald-600">{rows.filter(x => x.action === 'CREATE').length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400">UPDATE</p>
          <p className="text-2xl font-black text-amber-600">{rows.filter(x => x.action === 'UPDATE').length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400">DELETE</p>
          <p className="text-2xl font-black text-red-600">{rows.filter(x => x.action === 'DELETE').length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select className="input max-w-xs" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
          {modules.map(m => <option key={m} value={m}>{m === 'all' ? L('all') : m}</option>)}
        </select>
        <select className="input max-w-xs" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          {actions.map(a => <option key={a} value={a}>{a === 'all' ? L('all') : a}</option>)}
        </select>
      </div>

      <Table>
        <thead>
          <tr>
            <th>{L('date')}</th>
            <th>{L('actor')}</th>
            <th>{L('module')}</th>
            <th>{L('action')}</th>
            <th>{L('object')}</th>
            <th>{L('detail')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(x => (
            <tr key={x.id}>
              <td>{x.created_at ? new Date(x.created_at).toLocaleString('fr-FR') : '-'}</td>
              <td>{x.user_label || '-'}</td>
              <td>{x.module || '-'}</td>
              <td><Badge tone={tone(x.action)}>{x.action}</Badge></td>
              <td className="font-semibold">{x.object_label || '-'}</td>
              <td>{x.detail || '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

function StockMovements({ L }) {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('all');
  const [err, setErr] = useState('');

  async function load() {
    try {
      setErr('');
      const data = await loadStockMovements();
      setRows(data);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  if (err) return <ErrorBox msg={err} />;

  const filtered = tab === 'in'
    ? rows.filter(x => x.quantity > 0)
    : tab === 'out'
      ? rows.filter(x => x.quantity < 0)
      : rows;

  const totalIn = rows.filter(x => x.quantity > 0).reduce((s, x) => s + x.quantity, 0);
  const totalOut = rows.filter(x => x.quantity < 0).reduce((s, x) => s + Math.abs(x.quantity), 0);

  return (
    <>
      <Header title={L('stockMoves')}>
        <button onClick={load} className="btn bg-white border">↻</button>
      </Header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="card p-4">
          <p className="text-xs text-slate-400">{L('stockIn')}</p>
          <p className="text-2xl font-black text-emerald-600">{fmt(totalIn)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400">{L('stockOut')}</p>
          <p className="text-2xl font-black text-red-600">{fmt(totalOut)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400">{L('movement')}</p>
          <p className="text-2xl font-black">{rows.length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('all')} className={'btn ' + (tab === 'all' ? 'bg-slate-800 text-white' : 'bg-white border')}>{L('all')}</button>
        <button onClick={() => setTab('in')} className={'btn ' + (tab === 'in' ? 'bg-emerald-600 text-white' : 'bg-white border')}>{L('stockIn')}</button>
        <button onClick={() => setTab('out')} className={'btn ' + (tab === 'out' ? 'bg-red-600 text-white' : 'bg-white border')}>{L('stockOut')}</button>
      </div>

      <Table>
        <thead>
          <tr>
            <th>{L('date')}</th>
            <th>{L('ref')}</th>
            <th>{L('product')}</th>
            <th>{L('quantity')}</th>
            <th>{L('reason')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(m => (
            <tr key={m.id}>
              <td>{m.date ? new Date(m.date).toLocaleString('fr-FR') : '-'}</td>
              <td className="font-mono text-xs">{m.ref || '-'}</td>
              <td className="font-semibold">{m.productName || '-'}</td>
              <td>
                <Badge tone={m.quantity >= 0 ? 'green' : 'red'}>
                  {m.quantity >= 0 ? '+' : ''}{fmt(m.quantity)}
                </Badge>
              </td>
              <td>{m.reason || '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

function Parties({ L, type, session }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const data = await loadParties(type);
      setRows(data);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, [type]);

  async function save() {
    try {
      await saveParty(type, form);
      setForm(null);
      load();
    } catch (e) { alert(e.message); }
  }

  async function remove(id) {
    if (!confirm('Supprimer ?')) return;
    await deleteParty(type, id);
    load();
  }

  if (err) return <ErrorBox msg={err} />;

  return (
    <>
      <Header title={type === 'clients' ? L('clients') : L('suppliers')}>
        {hasPerm(session, type === 'clients' ? 'clients.write' : 'suppliers.write') ? <button onClick={() => setForm({ name: '', ice: '', phone: '', city: '', address: '' })} className="btn bg-amber-500">{L('new')}</button> : null}
      </Header>

      <div className="grid md:grid-cols-3 gap-3">
        {rows.map(x => (
          <div key={x.id} className="card p-4">
            <b>{x.name}</b>
            <p className="text-sm text-slate-500">ICE: {x.ice || '-'}<br />Tél: {x.phone || '-'}<br />{x.city || ''}</p>
            <div className="flex gap-1 mt-3">
              {hasPerm(session, type === 'clients' ? 'clients.write' : 'suppliers.write') ? <button onClick={() => setForm(x)} className="btn bg-white border">{L('edit')}</button> : null}
              {hasPerm(session, type === 'clients' ? 'clients.delete' : 'suppliers.delete') ? <button onClick={() => remove(x.id)} className="btn bg-red-600 text-white">{L('del')}</button> : null}
            </div>
          </div>
        ))}
      </div>

      {form ? (
        <Modal title={type === 'clients' ? L('clients') : L('suppliers')} onClose={() => setForm(null)}>
          {['name', 'ice', 'phone', 'city', 'address'].map(k => (
            <input key={k} className="input mb-2" placeholder={k} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />
          ))}
          <button onClick={save} className="btn bg-amber-500">{L('save')}</button>
        </Modal>
      ) : null}
    </>
  );
}

function Users({ L, session }) {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const [users, roles] = await Promise.all([loadUsers(), loadRoles()]);
      setRows(users);
      setRoles(roles);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    try {
      await createUser(form);
      setForm(null);
      load();
    } catch (e) { alert(e.message); }
  }

  if (err) return <ErrorBox msg={err} />;

  return (
    <>
      <Header title={L('users')}>
        {hasPerm(session, 'users.write') ? <button onClick={() => setForm({ username: '', password: 'changeme', full_name: '', role_id: roles[0]?.id })} className="btn bg-amber-500">{L('new')}</button> : null}
      </Header>

      <Table>
        <thead><tr><th>{L('username')}</th><th>{L('name')}</th><th>Rôle</th><th>Actif</th></tr></thead>
        <tbody>{rows.map(u => <tr key={u.id}><td>{u.username}</td><td>{u.full_name}</td><td>{u.role}</td><td>{u.active ? 'Oui' : 'Non'}</td></tr>)}</tbody>
      </Table>

      {form ? (
        <Modal title={L('users')} onClose={() => setForm(null)}>
          {['username', 'password', 'full_name'].map(k => (
            <input key={k} className="input mb-2" placeholder={k} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />
          ))}
          <select className="input mb-3" value={form.role_id} onChange={e => setForm({ ...form, role_id: Number(e.target.value) })}>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button onClick={save} className="btn bg-amber-500">{L('save')}</button>
        </Modal>
      ) : null}
    </>
  );
}


function Permissions({ L }) {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePerms, setRolePerms] = useState([]);
  const [err, setErr] = useState('');

  async function load() {
    try {
      setErr('');
      const data = await loadPermissionsMatrix();
      setRoles(data.roles);
      setPermissions(data.permissions);
      setRolePerms(data.rolePerms);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggle(roleId, permissionId, checked) {
    try {
      await setRolePermission(roleId, permissionId, checked);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (err) return <ErrorBox msg={err} />;

  const grouped = permissions.reduce((acc, p) => {
    const mod = p.module || 'Divers';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  function checked(roleId, permissionId) {
    return rolePerms.some(x => Number(x.role_id) === Number(roleId) && Number(x.permission_id) === Number(permissionId));
  }

  return (
    <>
      <Header title={L('permissions')}>
        <button onClick={load} className="btn bg-white border">↻</button>
      </Header>

      <div className="card overflow-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Module / Permission</th>
              {roles.map(r => <th key={r.id}>{r.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([mod, perms]) => (
              <React.Fragment key={mod}>
                <tr>
                  <td colSpan={roles.length + 1} className="bg-slate-100 font-bold text-slate-700">{mod}</td>
                </tr>
                {perms.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-semibold">{p.label || p.code}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.code}</div>
                    </td>
                    {roles.map(r => (
                      <td key={r.id}>
                        <input
                          type="checkbox"
                          checked={checked(r.id, p.id)}
                          onChange={e => toggle(r.id, p.id, e.target.checked)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}


createRoot(document.getElementById('root')).render(<App />);
