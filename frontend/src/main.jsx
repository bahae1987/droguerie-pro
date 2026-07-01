console.log("DROGUERIEPRO V6 TEST OK");
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './index.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  SUPABASE_URL || 'https://example.supabase.co',
  SUPABASE_ANON_KEY || 'missing-key'
);

const today = () => new Date().toISOString().slice(0, 10);
const fmt = n => (Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dh = n => fmt(n) + ' DH';

const TR = {
  fr: {
    login: 'Connexion', username: 'Utilisateur', password: 'Mot de passe', connect: 'Se connecter',
    dashboard: 'Tableau de bord', products: 'Produits / Stock', sales: 'Ventes', purchases: 'Achats',
    payments: 'Paiements', clients: 'Clients', suppliers: 'Fournisseurs', users: 'Utilisateurs',
    logout: 'Déconnexion', new: 'Nouveau', create: 'Créer', direct: 'Direct', save: 'Enregistrer',
    edit: 'Modifier', delete: 'Suppr.', actions: 'Actions', ref: 'Réf', name: 'Nom',
    category: 'Catégorie', stock: 'Stock', price: 'Prix', date: 'Date', customer: 'Client',
    supplier: 'Fournisseur', status: 'Étape', total: 'Total', payment: 'Règlement',
    all: 'Tous', quotes: 'Devis', orders: 'Commandes', deliveries: 'Livraisons',
    invoices: 'Factures', receipts: 'Réceptions', advance: 'Avancer', settle: 'Régler',
    partialDelivery: 'Liv. part.', partialReceipt: 'Réc. part.', base: 'Base', linked: 'lié',
    cashIn: 'Encaissements', cashOut: 'Décaissements', language: 'العربية',
    paid: 'réglée', unpaid: 'non réglée', partial: 'partielle', remaining: 'reste',
    stockAdjust: 'Ajustement stock', quantity: 'Quantité', reason: 'Motif', validate: 'Valider',
    active: 'Actif', role: 'Profil'
  },
  ar: {
    login: 'تسجيل الدخول', username: 'المستخدم', password: 'كلمة المرور', connect: 'دخول',
    dashboard: 'لوحة القيادة', products: 'المنتجات / المخزون', sales: 'المبيعات', purchases: 'المشتريات',
    payments: 'الأداءات', clients: 'الزبناء', suppliers: 'الموردون', users: 'المستخدمون',
    logout: 'خروج', new: 'جديد', create: 'إنشاء', direct: 'مباشر', save: 'حفظ',
    edit: 'تعديل', delete: 'حذف', actions: 'الإجراءات', ref: 'المرجع', name: 'الاسم',
    category: 'الصنف', stock: 'المخزون', price: 'الثمن', date: 'التاريخ', customer: 'الزبون',
    supplier: 'المورد', status: 'المرحلة', total: 'المجموع', payment: 'الأداء',
    all: 'الكل', quotes: 'العروض', orders: 'الطلبيات', deliveries: 'التسليمات',
    invoices: 'الفواتير', receipts: 'الاستلامات', advance: 'المرحلة التالية', settle: 'تسوية',
    partialDelivery: 'تسليم جزئي', partialReceipt: 'استلام جزئي', base: 'الأصل', linked: 'مرتبط',
    cashIn: 'المداخيل', cashOut: 'المصاريف', language: 'Français',
    paid: 'مؤداة', unpaid: 'غير مؤداة', partial: 'جزئية', remaining: 'الباقي',
    stockAdjust: 'تعديل المخزون', quantity: 'الكمية', reason: 'السبب', validate: 'تأكيد',
    active: 'نشط', role: 'الصلاحية'
  }
};

const ALL_PERMS = [
  'dashboard.read', 'products.read', 'products.write', 'products.delete',
  'clients.read', 'clients.write', 'clients.delete',
  'suppliers.read', 'suppliers.write', 'suppliers.delete',
  'sales.read', 'sales.write', 'sales.delete',
  'purchases.read', 'purchases.write', 'purchases.delete',
  'users.read', 'users.write'
];

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

function getSession() {
  try { return JSON.parse(localStorage.getItem('droguerie_session') || 'null'); }
  catch { return null; }
}
function setSession(s) { localStorage.setItem('droguerie_session', JSON.stringify(s)); }
function clearSession() { localStorage.removeItem('droguerie_session'); }
function can(perms, code) { return Array.isArray(perms) && perms.includes(code); }
function asJson(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return fallback; } }
  return v;
}
function totals(lines, vat = 20, priceIsTTC = true) {
  const base = (lines || []).reduce((s, l) => s + Number(l.prixUnit || 0) * Number(l.qte || 0), 0);
  if (priceIsTTC) {
    const totalTTC = base;
    const totalHT = totalTTC / (1 + vat / 100);
    return { totalHT, vat: totalTTC - totalHT, totalTTC };
  }
  const totalHT = base;
  return { totalHT, vat: totalHT * vat / 100, totalTTC: totalHT * (1 + vat / 100) };
}
function paidInfo(doc) {
  const payments = asJson(doc.payments_json || doc.paiements, []);
  const paid = payments.reduce((s, p) => s + Number(p.montant || 0), 0);
  const total = Number(doc.total_ttc ?? doc.totalTTC ?? 0);
  const rest = Math.max(0, total - paid);
  const status = paid <= 0.001 ? 'non_reglee' : rest <= 0.01 ? 'reglee' : 'partielle';
  return { paid, rest, status };
}
function mapProduct(p) {
  return {
    id: p.id, ref: p.ref, nom: p.name, categorie: p.category, unite: p.unit,
    prixAchat: Number(p.purchase_price || 0), prixVente: Number(p.sale_price || 0),
    quantite: Number(p.quantity || 0), stockMin: Number(p.min_stock || 0), fournisseurId: p.supplier_id
  };
}
function mapDoc(d) {
  const p = paidInfo(d);
  return {
    ...d,
    numeros: asJson(d.numbers_json, {}),
    lignes: asJson(d.lines_json, []),
    paiements: asJson(d.payments_json, []),
    totalHT: Number(d.total_ht || 0),
    totalTTC: Number(d.total_ttc || 0),
    tva: Number(d.vat || 0),
    tauxTva: Number(d.vat_rate || 20),
    clientNom: d.client_name,
    fournisseurNom: d.supplier_name,
    paye: p.paid,
    reste: p.rest,
    statutPaiement: p.status,
    baseDocId: d.base_doc_id || null
  };
}
async function nextNumber(prefix) {
  const { data } = await supabase.from('counters').select('value').eq('name', prefix).maybeSingle();
  const n = Number(data?.value || 1);
  const { error } = await supabase.from('counters').upsert({ name: prefix, value: n + 1 }, { onConflict: 'name' });
  if (error) throw new Error(error.message);
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`;
}
async function updateStock(lines, sign, reason) {
  for (const l of lines || []) {
    const productId = Number(l.produitId || l.product_id || l.id);
    const qty = Number(l.qte || l.quantity || 0);
    if (!productId || !qty) continue;
    const { data: p, error: e1 } = await supabase.from('products').select('quantity').eq('id', productId).single();
    if (e1) throw new Error(e1.message);
    const newQty = Number(p.quantity || 0) + qty * sign;
    const { error: e2 } = await supabase.from('products').update({ quantity: newQty }).eq('id', productId);
    if (e2) throw new Error(e2.message);
    await supabase.from('stock_movements').insert({
      product_id: productId, quantity: qty * sign, reason, created_at: new Date().toISOString()
    });
  }
}
async function partyName(type, id, fallback = '') {
  if (!id) return fallback;
  const table = type === 'sales' ? 'clients' : 'suppliers';
  const { data } = await supabase.from(table).select('name').eq('id', id).maybeSingle();
  return data?.name || fallback;
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

  return {
    token: 'supabase',
    user: { id: data.id, username: data.username, full_name: data.full_name, role: data.roles?.name || 'Administrateur' },
    perms: ALL_PERMS
  };
}
async function dashboardData() {
  const [{ data: products, error: pErr }, { data: sales, error: sErr }, { data: purchases, error: aErr }] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('sales').select('*'),
    supabase.from('purchases').select('*')
  ]);
  if (pErr) throw new Error(pErr.message);
  if (sErr) throw new Error(sErr.message);
  if (aErr) throw new Error(aErr.message);
  const factures = (sales || []).filter(x => x.stage === 'facture');
  const factAch = (purchases || []).filter(x => x.stage === 'facture');
  return {
    products: products?.length || 0,
    lowStock: products?.filter(p => Number(p.quantity) <= Number(p.min_stock)).length || 0,
    stockValue: products?.reduce((s, p) => s + Number(p.quantity || 0) * Number(p.purchase_price || 0), 0) || 0,
    ca: factures.reduce((s, x) => s + Number(x.total_ttc || 0), 0),
    dettes: factAch.reduce((s, x) => s + paidInfo(x).rest, 0)
  };
}
async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data || []).map(mapProduct);
}
async function saveProduct(body) {
  const payload = {
    ref: body.ref || '', name: body.nom || body.name || '', category: body.categorie || 'Divers',
    unit: body.unite || 'Pièce', purchase_price: Number(body.prixAchat || 0),
    sale_price: Number(body.prixVente || 0), quantity: Number(body.quantite || 0),
    min_stock: Number(body.stockMin || 0), supplier_id: body.fournisseurId || null
  };
  const q = body.id ? supabase.from('products').update(payload).eq('id', body.id) : supabase.from('products').insert(payload);
  const { error } = await q;
  if (error) throw new Error(error.message);
}
async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
async function loadParties(type) {
  const { data, error } = await supabase.from(type).select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
}
async function saveParty(type, body) {
  const payload = type === 'clients'
    ? { name: body.name || body.nom || '', type: body.type || 'entreprise', ice: body.ice || '', phone: body.phone || body.tel || '', city: body.city || body.ville || '', address: body.address || body.adresse || '' }
    : { name: body.name || body.nom || '', ice: body.ice || '', phone: body.phone || body.tel || '', city: body.city || body.ville || '', contact: body.contact || '', address: body.address || body.adresse || '' };
  const q = body.id ? supabase.from(type).update(payload).eq('id', body.id) : supabase.from(type).insert(payload);
  const { error } = await q;
  if (error) throw new Error(error.message);
}
async function deleteParty(type, id) {
  const { error } = await supabase.from(type).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
async function loadDocs(type) {
  const { data, error } = await supabase.from(type).select('*').order('id', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapDoc);
}
async function createDoc(type, body) {
  const isSales = type === 'sales';
  const start = body.start || (isSales ? 'devis' : 'commande');
  const lines = body.lignes || [];
  const vat = Number(body.tauxTva || 20);
  const t = totals(lines, vat, isSales);
  let prefix, key;
  if (isSales) {
    prefix = start === 'facture' ? 'FAC' : start === 'commande' ? 'BC' : start === 'livraison' ? 'BL' : 'DEV';
    key = start === 'facture' ? 'facture' : start === 'commande' ? 'commande' : start === 'livraison' ? 'bl' : 'devis';
  } else {
    prefix = start === 'facture' ? 'FF' : start === 'reception' ? 'BR' : 'CF';
    key = start === 'facture' ? 'facture' : start === 'reception' ? 'reception' : 'commande';
  }
  const numbers = { [key]: await nextNumber(prefix) };
  if (isSales && (start === 'livraison' || start === 'facture')) await updateStock(lines, -1, start === 'facture' ? 'Vente directe' : 'Livraison vente');
  if (!isSales && (start === 'reception' || start === 'facture')) await updateStock(lines, 1, start === 'facture' ? 'Facture fournisseur directe' : 'Réception achat');
  const session = getSession();
  const payload = isSales ? {
    date: body.date || today(), client_id: body.clientId || null, client_name: body.clientNom || await partyName(type, body.clientId),
    stage: start, numbers_json: numbers, lines_json: lines, payments_json: [],
    vat_rate: vat, total_ht: t.totalHT, vat: t.vat, total_ttc: t.totalTTC,
    delivered: start === 'livraison' || start === 'facture', created_by: session?.user?.id || null, base_doc_id: body.baseDocId || null
  } : {
    date: body.date || today(), supplier_id: body.fournisseurId || null, supplier_name: body.fournisseurNom || await partyName(type, body.fournisseurId),
    stage: start, numbers_json: numbers, lines_json: lines, payments_json: [],
    vat_rate: vat, total_ht: t.totalHT, vat: t.vat, total_ttc: t.totalTTC,
    received: start === 'reception' || start === 'facture', created_by: session?.user?.id || null, base_doc_id: body.baseDocId || null
  };
  const { error } = await supabase.from(type).insert(payload);
  if (error) throw new Error(error.message);
}
async function updateDoc(type, id, body) {
  const isSales = type === 'sales';
  const lines = body.lignes || [];
  const vat = Number(body.tauxTva || 20);
  const t = totals(lines, vat, isSales);
  const payload = { date: body.date || today(), lines_json: lines, vat_rate: vat, total_ht: t.totalHT, vat: t.vat, total_ttc: t.totalTTC };
  if (isSales) { payload.client_id = body.clientId || null; payload.client_name = body.clientNom || await partyName(type, payload.client_id); }
  else { payload.supplier_id = body.fournisseurId || null; payload.supplier_name = body.fournisseurNom || await partyName(type, payload.supplier_id); }
  const { error } = await supabase.from(type).update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}
async function deleteDoc(type, id) {
  const { data: doc, error: e1 } = await supabase.from(type).select('*').eq('id', id).single();
  if (e1) throw new Error(e1.message);
  const lines = asJson(doc.lines_json, []);
  if (type === 'sales' && doc.delivered) await updateStock(lines, 1, 'Suppression vente - restitution stock');
  if (type === 'purchases' && doc.received) await updateStock(lines, -1, 'Suppression achat - retrait stock');
  const { error } = await supabase.from(type).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
async function advanceDoc(type, id) {
  const isSales = type === 'sales';
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  const stages = isSales ? ['devis', 'commande', 'livraison', 'facture'] : ['commande', 'reception', 'facture'];
  const next = stages[stages.indexOf(doc.stage) + 1];
  if (!next) return;
  const prefixes = isSales ? { commande: 'BC', livraison: 'BL', facture: 'FAC' } : { reception: 'BR', facture: 'FF' };
  const keys = isSales ? { commande: 'commande', livraison: 'bl', facture: 'facture' } : { reception: 'reception', facture: 'facture' };
  const numbers = { ...asJson(doc.numbers_json, {}), [keys[next]]: await nextNumber(prefixes[next]) };
  const lines = asJson(doc.lines_json, []);
  if (isSales && next === 'livraison' && !doc.delivered) await updateStock(lines, -1, 'Livraison vente');
  if (!isSales && next === 'reception' && !doc.received) await updateStock(lines, 1, 'Réception achat');
  const payload = isSales ? { stage: next, numbers_json: numbers, delivered: next === 'livraison' ? true : doc.delivered } : { stage: next, numbers_json: numbers, received: next === 'reception' ? true : doc.received };
  const { error: e2 } = await supabase.from(type).update(payload).eq('id', id);
  if (e2) throw new Error(e2.message);
}
async function payDoc(type, id, body) {
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  const payments = asJson(doc.payments_json, []);
  const info = paidInfo(doc);
  const montant = Number(body.montant || info.rest || 0);
  if (montant <= 0) throw new Error('Montant de règlement invalide');
  payments.push({ id: String(Date.now()), date: body.date || today(), mode: body.mode || 'Espèces', montant });
  const { error: e2 } = await supabase.from(type).update({ payments_json: payments }).eq('id', id);
  if (e2) throw new Error(e2.message);
}
async function partialDoc(type, id, body) {
  const isSales = type === 'sales';
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  const original = asJson(doc.lines_json, []);
  const lines = original.map(l => ({ ...l, qte: Number(body.qte || l.qte || 0) })).filter(l => Number(l.qte) > 0);
  const vat = Number(doc.vat_rate || 20);
  const t = totals(lines, vat, isSales);
  const stage = isSales ? 'livraison' : 'reception';
  const prefix = isSales ? 'BL' : 'BR';
  const key = isSales ? 'bl' : 'reception';
  const numbers = { ...asJson(doc.numbers_json, {}), [key]: await nextNumber(prefix) };
  if (isSales) await updateStock(lines, -1, 'Livraison partielle vente');
  else await updateStock(lines, 1, 'Réception partielle achat');
  const session = getSession();
  const payload = isSales ? {
    date: body.date || today(), client_id: doc.client_id, client_name: doc.client_name, stage,
    numbers_json: numbers, lines_json: lines, payments_json: [], vat_rate: vat,
    total_ht: t.totalHT, vat: t.vat, total_ttc: t.totalTTC, delivered: true,
    created_by: session?.user?.id || null, base_doc_id: doc.id
  } : {
    date: body.date || today(), supplier_id: doc.supplier_id, supplier_name: doc.supplier_name, stage,
    numbers_json: numbers, lines_json: lines, payments_json: [], vat_rate: vat,
    total_ht: t.totalHT, vat: t.vat, total_ttc: t.totalTTC, received: true,
    created_by: session?.user?.id || null, base_doc_id: doc.id
  };
  const { error: e2 } = await supabase.from(type).insert(payload);
  if (e2) throw new Error(e2.message);
}
async function loadPayments() {
  const [{ data: sales, error: e1 }, { data: purchases, error: e2 }] = await Promise.all([
    supabase.from('sales').select('*').order('id', { ascending: false }),
    supabase.from('purchases').select('*').order('id', { ascending: false })
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  const enc = (sales || []).flatMap(d => asJson(d.payments_json, []).map(p => ({
    type: 'encaissement', docType: 'vente', docId: d.id, docNumber: Object.values(asJson(d.numbers_json, {}))[0], tiers: d.client_name, ...p
  })));
  const dec = (purchases || []).flatMap(d => asJson(d.payments_json, []).map(p => ({
    type: 'decaissement', docType: 'achat', docId: d.id, docNumber: Object.values(asJson(d.numbers_json, {}))[0], tiers: d.supplier_name, ...p
  })));
  return [...enc, ...dec].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
async function loadUsers() {
  const { data, error } = await supabase.from('users').select('id, username, full_name, active, roles(name)').order('id');
  if (error) throw new Error(error.message);
  return (data || []).map(u => ({ id: u.id, username: u.username, full_name: u.full_name, active: u.active, role: u.roles?.name }));
}
async function loadRoles() {
  const { data, error } = await supabase.from('roles').select('*').order('id');
  if (error) throw new Error(error.message);
  return data || [];
}
async function createUser(body) {
  const { error } = await supabase.from('users').insert({
    username: body.username, password_hash: body.password || 'changeme',
    full_name: body.full_name || '', role_id: body.role_id, active: true
  });
  if (error) throw new Error(error.message);
}

function Login({ onLogin, L, lang }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const s = await login(username, password);
      setSession(s);
      onLogin(s);
    } catch (e) { setErr(e.message); }
  }
  return (
    <div className={`min-h-screen grid place-items-center bg-slate-900 ${lang === 'ar' ? 'rtl' : ''}`}>
      <form onSubmit={submit} className="bg-white p-7 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <span className="bg-amber-500 font-black rounded-xl w-12 h-12 grid place-items-center">DP</span>
          <div><h1 className="font-bold text-xl">DrogueriePro</h1><p className="text-xs text-slate-400">{L('login')}</p></div>
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
            {menu.map(([id, label]) => <button key={id} onClick={() => setPage(id)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${page === id ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-slate-800'}`}>{label}</button>)}
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
function Header({ title, children }) { return <div className="flex justify-between items-end mb-5"><h1 className="text-2xl font-bold text-slate-800">{title}</h1><div className="flex gap-2">{children}</div></div>; }
function Modal({ title, onClose, children, wide = false }) { return <div className="fixed inset-0 bg-slate-900/60 z-50 grid place-items-center p-4 overflow-auto"><div className={`bg-white rounded-2xl shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-lg'} w-full p-5`}><div className="flex justify-between mb-4"><h2 className="font-bold text-lg">{title}</h2><button onClick={onClose}>✕</button></div>{children}</div></div>; }
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
  const load = () => dashboardData().then(setD).catch(e => setErr(e.message));
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
  const load = () => loadProducts().then(setRows).catch(e => setErr(e.message));
  useEffect(load, []);
  async function save() { await saveProduct(form); setForm(null); load(); }
  async function del(id) { if (!confirm('Supprimer ?')) return; await deleteProduct(id); load(); }
  async function adjust() { await updateStock([{ produitId: stock.id, qte: Number(stock.qte) }], 1, stock.reason || L('stockAdjust')); setStock(null); load(); }
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
  const load = () => Promise.all([loadDocs(type), loadProducts(), loadParties(isSales ? 'clients' : 'suppliers')]).then(([a, b, c]) => { setRows(a); setProducts(b); setParties(c); }).catch(e => setErr(e.message));
  useEffect(load, []);
  const perm = isSales ? 'sales.write' : 'purchases.write';
  const stages = isSales ? [['tous', L('all')], ['devis', L('quotes')], ['commande', L('orders')], ['livraison', L('deliveries')], ['facture', L('invoices')]] : [['tous', L('all')], ['commande', L('orders')], ['reception', L('receipts')], ['facture', L('invoices')]];
  const filtered = tab === 'tous' ? rows : rows.filter(x => x.stage === tab);
  function create(start) { setForm({ start, date: today(), partyId: parties[0]?.id || '', lignes: [{ produitId: products[0]?.id || '', qte: 1 }] }); }
  async function save() {
    const lines = form.lignes.map(l => { const prod = products.find(x => String(x.id) === String(l.produitId)); if (!prod) throw new Error('Produit non sélectionné'); return { produitId: prod.id, ref: prod.ref, nom: prod.nom, prixUnit: isSales ? prod.prixVente : prod.prixAchat, qte: Number(l.qte) }; });
    const party = parties.find(x => String(x.id) === String(form.partyId)); if (!party) throw new Error(isSales ? 'Client non sélectionné' : 'Fournisseur non sélectionné');
    const body = { start: form.start, date: form.date, lignes: lines, tauxTva: 20, clientId: party.id, clientNom: party.name || party.nom, fournisseurId: party.id, fournisseurNom: party.name || party.nom };
    if (form.id) await updateDoc(type, form.id, body); else await createDoc(type, body);
    setForm(null); load();
  }
  async function advance(id) { await advanceDoc(type, id); load(); }
  async function del(id) { if (!confirm('Supprimer ?')) return; await deleteDoc(type, id); load(); }
  async function settle() { await payDoc(type, pay.id, { date: pay.date, mode: pay.mode, montant: Number(pay.montant) }); setPay(null); load(); }
  async function doPartial() { await partialDoc(type, partial.doc.id, { qte: Number(partial.qte) }); setPartial(null); load(); }
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
  const load = () => loadPayments().then(setRows).catch(e => setErr(e.message));
  useEffect(load, []);
  if (err) return <ErrorBox msg={err} />;
  const filtered = tab === 'all' ? rows : rows.filter(x => x.type === tab);
  return <><Header title={L('payments')}><button onClick={load} className="btn bg-white border">↻</button></Header><div className="flex gap-2 mb-4"><button onClick={() => setTab('all')} className={`btn ${tab === 'all' ? 'bg-slate-800 text-white' : 'bg-white border'}`}>{L('all')}</button><button onClick={() => setTab('encaissement')} className={`btn ${tab === 'encaissement' ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>{L('cashIn')}</button><button onClick={() => setTab('decaissement')} className={`btn ${tab === 'decaissement' ? 'bg-red-600 text-white' : 'bg-white border'}`}>{L('cashOut')}</button></div><Table><thead><tr><th>{L('date')}</th><th>Type</th><th>Document</th><th>Tiers</th><th>Mode</th><th>Montant</th></tr></thead><tbody>{filtered.map((p, i) => <tr key={i}><td>{p.date}</td><td><Badge tone={p.type === 'encaissement' ? 'emerald' : 'red'}>{p.type === 'encaissement' ? L('cashIn') : L('cashOut')}</Badge></td><td>{p.docNumber || '#' + p.docId}</td><td>{p.tiers}</td><td>{p.mode}</td><td className="font-bold">{dh(p.montant)}</td></tr>)}</tbody></Table></>;
}
function SimpleList({ L, type }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const load = () => loadParties(type).then(setRows).catch(e => setErr(e.message));
  useEffect(load, []);
  async function save() { await saveParty(type, form); setForm(null); load(); }
  async function del(id) { if (!confirm('Supprimer ?')) return; await deleteParty(type, id); load(); }
  if (err) return <ErrorBox msg={err} />;
  return <><Header title={type === 'clients' ? L('clients') : L('suppliers')}><button onClick={() => setForm({ name: '', ice: '', phone: '', city: '' })} className="btn bg-amber-500">{L('new')}</button></Header><div className="grid md:grid-cols-3 gap-3">{rows.map(x => <div key={x.id} className="card p-4"><b>{x.name}</b><p className="text-sm text-slate-500">ICE: {x.ice || '-'}<br />Tél: {x.phone || '-'}<br />{x.city || ''}</p><div className="flex gap-1 mt-3"><button onClick={() => setForm(x)} className="btn bg-white border">{L('edit')}</button><button onClick={() => del(x.id)} className="btn bg-red-600 text-white">{L('delete')}</button></div></div>)}</div>{form && <Modal title={type === 'clients' ? L('clients') : L('suppliers')} onClose={() => setForm(null)}>{['name', 'ice', 'phone', 'city', 'address'].map(k => <input key={k} className="input mb-2" placeholder={k} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />)}<button onClick={save} className="btn bg-amber-500">{L('save')}</button></Modal>}</>;
}
function UsersPage({ L }) {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const load = () => Promise.all([loadUsers(), loadRoles()]).then(([u, r]) => { setRows(u); setRoles(r); }).catch(e => setErr(e.message));
  useEffect(load, []);
  async function save() { await createUser(form); setForm(null); load(); }
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
  const [session, setSessionState] = useState(getSession());

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return <div className="min-h-screen bg-slate-100 grid place-items-center p-6"><div className="bg-white rounded-2xl shadow p-6 max-w-xl"><h1 className="font-bold text-xl text-red-600 mb-3">Configuration Supabase manquante</h1><p>Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Vercel puis redéploie.</p></div></div>;
  }
  if (!session) return <Login onLogin={setSessionState} L={L} lang={lang} />;
  return <Shell session={session} setSessionState={setSessionState} lang={lang} L={L} toggle={toggle} />;
}

createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
