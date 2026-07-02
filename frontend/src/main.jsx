import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './index.css';

console.log('DROGUERIEPRO V19 DOC PRINT PREVIEW OK');

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
    payments: 'Paiements', settings: 'Paramètres', permissions: 'Autorisations', clients: 'Clients', suppliers: 'Fournisseurs', users: 'Utilisateurs', branch: 'Droguerie', branches: 'Gestion drogueries', city: 'Ville', manager: 'Responsable', active: 'Actif', deactivate: 'Désactiver', activate: 'Activer', fullName: 'Nom complet', changePassword: 'Changer mot de passe',
    logout: 'Déconnexion', lang: 'العربية', new: 'Nouveau', save: 'Enregistrer', edit: 'Modifier',
    del: 'Supprimer', actions: 'Actions', stock: 'Stock', price: 'Prix', create: 'Créer',
    direct: 'Direct', advance: 'Avancer', pay: 'Régler', partialDelivery: 'Livraison partielle',
    partialReceipt: 'Réception partielle', all: 'Tous', quotes: 'Devis', orders: 'Commandes',
    deliveries: 'Livraisons', receipts: 'Réceptions', invoices: 'Factures', remaining: 'Reste',
    paid: 'Réglée', unpaid: 'Non réglée', partial: 'Partielle', cashIn: 'Encaissements',
    cashOut: 'Décaissements', vat: 'TVA', theme: 'Thème', company: 'Société', address: 'Adresse', phone: 'Téléphone', ice: 'ICE', cashRegister: 'Caisse', receiptNo: 'N° reçu', chequeNo: 'N° chèque', bank: 'Banque', dueDate: 'Échéance', paymentStatus: 'Statut', transferRef: 'Réf. virement', valueDate: 'Date valeur', terminal: 'TPE', transactionNo: 'N° transaction', billNo: 'N° effet', note: 'Observation', quantity: 'Quantité', date: 'Date', customer: 'Client',
    supplier: 'Fournisseur', product: 'Produit', base: 'Base', remainingQty: 'Qté restante', orderedQty: 'Qté commandée', deliveredQty: 'Qté livrée', receivedQty: 'Qté reçue', open: 'Ouvert', closed: 'Clôturé', preview: 'Aperçu', print: 'Imprimer', unitPrice: 'PU', totalHT: 'Total HT', totalVAT: 'TVA', totalTTC: 'Total TTC'
  },
  ar: {
    login: 'تسجيل الدخول', username: 'المستخدم', password: 'كلمة المرور', connect: 'دخول',
    dashboard: 'لوحة القيادة', products: 'المنتجات / المخزون', sales: 'المبيعات', purchases: 'المشتريات',
    payments: 'الأداءات', settings: 'الإعدادات', permissions: 'الصلاحيات', clients: 'الزبناء', suppliers: 'الموردون', users: 'المستخدمون', branch: 'الدروكري', branches: 'تدبير الدروكريات', city: 'المدينة', manager: 'المسؤول', active: 'نشط', deactivate: 'تعطيل', activate: 'تفعيل', fullName: 'الاسم الكامل', changePassword: 'تغيير كلمة المرور',
    logout: 'خروج', lang: 'Français', new: 'جديد', save: 'حفظ', edit: 'تعديل',
    del: 'حذف', actions: 'الإجراءات', stock: 'المخزون', price: 'الثمن', create: 'إنشاء',
    direct: 'مباشر', advance: 'المرحلة التالية', pay: 'تسوية', partialDelivery: 'تسليم جزئي',
    partialReceipt: 'استلام جزئي', all: 'الكل', quotes: 'العروض', orders: 'الطلبيات',
    deliveries: 'التسليمات', receipts: 'الاستلامات', invoices: 'الفواتير', remaining: 'الباقي',
    paid: 'مؤداة', unpaid: 'غير مؤداة', partial: 'جزئية', cashIn: 'المداخيل',
    cashOut: 'المصاريف', vat: 'الضريبة', theme: 'المظهر', company: 'الشركة', address: 'العنوان', phone: 'الهاتف', ice: 'ICE', cashRegister: 'الصندوق', receiptNo: 'رقم الوصل', chequeNo: 'رقم الشيك', bank: 'البنك', dueDate: 'الاستحقاق', paymentStatus: 'الحالة', transferRef: 'مرجع التحويل', valueDate: 'تاريخ القيمة', terminal: 'جهاز الأداء', transactionNo: 'رقم العملية', billNo: 'رقم الكمبيالة', note: 'ملاحظة', quantity: 'الكمية', date: 'التاريخ', customer: 'الزبون',
    supplier: 'المورد', product: 'المنتج', base: 'الأصل', remainingQty: 'الكمية المتبقية', orderedQty: 'الكمية المطلوبة', deliveredQty: 'الكمية المسلمة', receivedQty: 'الكمية المستلمة', open: 'مفتوح', closed: 'مغلق', preview: 'معاينة', print: 'طباعة', unitPrice: 'ثمن الوحدة', totalHT: 'المجموع بدون ضريبة', totalVAT: 'الضريبة', totalTTC: 'المجموع مع الضريبة'
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


function hasPerm(session, code) {
  return Array.isArray(session?.perms) && session.perms.includes(code);
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

async function getUserPermissions(userId) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role_id')
    .eq('id', userId)
    .single();

  if (userError) throw new Error(userError.message);

  if (!user?.role_id) {
    return [];
  }

  const { data, error } = await supabase
    .from('role_permissions')
    .select('permissions(code)')
    .eq('role_id', user.role_id);

  if (error) throw new Error(error.message);

  return (data || [])
    .map(x => x.permissions?.code)
    .filter(Boolean);
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
    baseDocId: d.base_doc_id || null,
    qtyDone: Number(d.qty_done || 0),
    qtyStatus: docStatus(d),
    qtyRemaining: docRemainingQty(d)
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
    .select('id, username, full_name, password_hash, active, branch_id, branches(name), roles(name)')
    .eq('username', username)
    .eq('active', true)
    .single();

  if (error || !data) throw new Error('Identifiant incorrect');
  if (password !== data.password_hash) throw new Error('Mot de passe incorrect');

  const userPerms = await getUserPermissions(data.id);

  return {
    user: {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      role: data.roles?.name || 'Sans profil'
    },
    perms: userPerms
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


async function refreshCurrentSession(setSession) {
  const current = getStoredSession();
  if (!current?.user?.id) return;
  const perms = await getUserPermissions(current.user.id);
  const updated = { ...current, perms };
  setStoredSession(updated);
  setSession(updated);
}


function isAdmin(session) {
  return session?.user?.role === 'Administrateur';
}

function isManager(session) {
  return session?.user?.role === 'Gérant';
}

function isSeller(session) {
  return session?.user?.role === 'Vendeur';
}

function isStoreKeeper(session) {
  return session?.user?.role === 'Magasinier';
}

function branchId(session) {
  return session?.user?.branch_id || null;
}

function applyDocScope(query, type, session) {
  if (isAdmin(session)) return query;

  if (isManager(session)) {
    return branchId(session) ? query.eq('branch_id', branchId(session)) : query.eq('branch_id', -1);
  }

  if (type === 'sales' && isSeller(session)) {
    return query.eq('created_by', session.user.id);
  }

  if (type === 'purchases' && isStoreKeeper(session)) {
    return query.eq('created_by', session.user.id);
  }

  return query.eq('created_by', session.user.id);
}

function applyProductScope(query, session) {
  if (isAdmin(session)) return query;
  if (branchId(session)) return query.eq('branch_id', branchId(session));
  return query.eq('branch_id', -1);
}

async function loadBranches() {
  const { data, error } = await supabase.from('branches').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
}



async function saveBranch(branch) {
  const payload = {
    name: branch.name || '',
    city: branch.city || '',
    address: branch.address || '',
    phone: branch.phone || '',
    manager_name: branch.manager_name || '',
    active: branch.active !== false
  };

  const q = branch.id
    ? supabase.from('branches').update(payload).eq('id', branch.id)
    : supabase.from('branches').insert(payload);

  const { error } = await q;
  if (error) throw new Error(error.message);
}

async function deleteBranch(id) {
  const { error } = await supabase.from('branches').update({ active: false }).eq('id', id);
  if (error) throw new Error(error.message);
}

async function loadUsersForBranch() {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, full_name, branch_id, roles(name)')
    .order('full_name');

  if (error) throw new Error(error.message);
  return data || [];
}

async function assignUserBranch(userId, branchId) {
  const { error } = await supabase
    .from('users')
    .update({ branch_id: branchId || null })
    .eq('id', userId);

  if (error) throw new Error(error.message);
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


async function getVatRate() {
  try {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'vat_rate').maybeSingle();
    return Number(data?.value || 20);
  } catch { return 20; }
}

async function loadSettings() {
  const defaults = { vat_rate: '20', theme: 'light', company_name: 'DrogueriePro', company_ice: '', company_phone: '', company_address: '' };
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) return defaults;
  const out = { ...defaults };
  (data || []).forEach(x => { out[x.key] = x.value; });
  return out;
}

async function saveSettings(settings) {
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value: String(value ?? '') }));
  const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(error.message);
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
    const { error } = await supabase.from('role_permissions').upsert({ role_id: roleId, permission_id: permissionId }, { onConflict: 'role_id,permission_id' });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('role_permissions').delete().eq('role_id', roleId).eq('permission_id', permissionId);
    if (error) throw new Error(error.message);
  }
}


function docNo(doc, key) {
  const nums = jsonValue(doc.numbers_json || doc.numeros, {});
  if (key && nums[key]) return nums[key];
  return Object.values(nums)[0] || ('#' + doc.id);
}

function docQty(lines) {
  return (lines || []).reduce((s, l) => s + Number(l.qte || 0), 0);
}

function docRemainingQty(doc) {
  const lines = jsonValue(doc.lines_json || doc.lignes, []);
  const total = docQty(lines);
  const done = Number(doc.qty_done || 0);
  return Math.max(0, total - done);
}

function docStatus(doc) {
  const rem = docRemainingQty(doc);
  if (doc.stage === 'facture') return 'closed';
  if (rem <= 0 && ['livraison', 'reception'].includes(doc.stage)) return 'closed';
  if (Number(doc.qty_done || 0) > 0) return 'partial';
  return 'open';
}

function makePartialLines(doc, qte) {
  const original = jsonValue(doc.lines_json || doc.lignes, []);
  const remaining = docRemainingQty(doc);
  const requested = Math.min(Number(qte || 0), remaining || Number(qte || 0));
  if (!requested || requested <= 0) throw new Error('Quantité partielle invalide');

  const total = docQty(original);
  if (!total) throw new Error('Document sans quantité');

  return original.map(l => {
    const lineQty = Number(l.qte || 0);
    const ratio = lineQty / total;
    return { ...l, qte: Number((requested * ratio).toFixed(4)) };
  }).filter(l => Number(l.qte) > 0);
}

function nextStageAllowed(doc, type) {
  if (type === 'sales') {
    if (doc.stage === 'devis') return 'commande';
    if (doc.stage === 'commande') return 'livraison';
    if (doc.stage === 'livraison') return 'facture';
    return null;
  }

  if (doc.stage === 'commande') return 'reception';
  if (doc.stage === 'reception') return 'facture';
  return null;
}

function canPayDocument(doc) {
  return doc.stage === 'facture';
}

function paymentButtonVisible(doc) {
  return doc.stage === 'facture' && Number(doc.reste || 0) > 0;
}


async function createDoc(type, body) {
  const isSales = type === 'sales';
  const start = body.start || (isSales ? 'devis' : 'commande');
  const lines = body.lignes || [];
  const vat = Number(body.tauxTva || await getVatRate());
  const t = computeTotals(lines, vat, isSales);
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
  const session = getStoredSession();
  const payload = isSales ? {
    date: body.date || today(), client_id: body.clientId || null, client_name: body.clientNom || await partyName(type, body.clientId),
    stage: start, numbers_json: numbers, lines_json: lines, payments_json: [], vat_rate: vat, total_ht: t.totalHT, vat: t.vat, total_ttc: t.totalTTC,
    delivered: start === 'livraison' || start === 'facture',
    qty_done: (start === 'livraison' || start === 'facture') ? docQty(lines) : 0,
    doc_status: (start === 'facture') ? 'closed' : ((start === 'livraison') ? 'closed' : 'open'), created_by: session?.user?.id || null, base_doc_id: body.baseDocId || null,
    branch_id: isAdmin(session) ? (body.branchId || branchId(session)) : branchId(session)
  } : {
    date: body.date || today(), supplier_id: body.fournisseurId || null,
      branch_id: isAdmin(getStoredSession()) ? (body.branch_id || branchId(getStoredSession())) : branchId(getStoredSession()), supplier_name: body.fournisseurNom || await partyName(type, body.fournisseurId),
    stage: start, numbers_json: numbers, lines_json: lines, payments_json: [], vat_rate: vat, total_ht: t.totalHT, vat: t.vat, total_ttc: t.totalTTC,
    received: start === 'reception' || start === 'facture',
    qty_done: (start === 'reception' || start === 'facture') ? docQty(lines) : 0,
    doc_status: (start === 'facture') ? 'closed' : ((start === 'reception') ? 'closed' : 'open'), created_by: session?.user?.id || null, base_doc_id: body.baseDocId || null,
    branch_id: isAdmin(session) ? (body.branchId || branchId(session)) : branchId(session)
  };
  const { error } = await supabase.from(type).insert(payload);
  if (error) throw new Error(error.message);
}

async function updateDoc(type, id, body) {
  const isSales = type === 'sales';
  const lines = body.lignes || [];
  const vat = Number(body.tauxTva || await getVatRate());
  const t = computeTotals(lines, vat, isSales);
  const payload = { date: body.date || today(), lines_json: lines, vat_rate: vat, total_ht: t.totalHT, vat: t.vat, total_ttc: t.totalTTC };
  if (isSales) { payload.client_id = body.clientId || null; payload.client_name = body.clientNom || await partyName(type, payload.client_id); }
  else { payload.supplier_id = body.fournisseurId || null; payload.supplier_name = body.fournisseurNom || await partyName(type, payload.supplier_id); }
  const { error } = await supabase.from(type).update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

async function deleteDoc(type, id) {
  const { data: doc, error: e1 } = await supabase.from(type).select('*').eq('id', id).single();
  if (e1) throw new Error(e1.message);
  const lines = jsonValue(doc.lines_json, []);
  if (type === 'sales' && doc.delivered) await updateStock(lines, 1, 'Suppression vente - restitution stock');
  if (type === 'purchases' && doc.received) await updateStock(lines, -1, 'Suppression achat - retrait stock');
  const { error } = await supabase.from(type).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

async function advanceDoc(type, id) {
  const isSales = type === 'sales';
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single();
  if (error) throw new Error(error.message);

  const next = nextStageAllowed(doc, type);
  if (!next) return;

  const oldLines = jsonValue(doc.lines_json, []);
  const vatRate = Number(doc.vat_rate || 20);

  const prefixes = isSales
    ? { commande: 'CMDV', livraison: 'BLV', facture: 'FACV' }
    : { reception: 'BRA', facture: 'FACA' };

  const keys = isSales
    ? { commande: 'commande', livraison: 'livraison', facture: 'facture' }
    : { reception: 'reception', facture: 'facture' };

  const nums = { ...jsonValue(doc.numbers_json, {}) };
  nums[keys[next]] = nums[keys[next]] || await nextNumber(prefixes[next]);

  if (isSales && next === 'livraison' && !doc.delivered) {
    await updateStock(oldLines, -1, 'Livraison vente ' + nums[keys[next]]);
  }

  if (!isSales && next === 'reception' && !doc.received) {
    await updateStock(oldLines, 1, 'Réception achat ' + nums[keys[next]]);
  }

  const totalQty = docQty(oldLines);

  const payload = isSales
    ? {
        stage: next,
        numbers_json: nums,
        delivered: next === 'livraison' ? true : doc.delivered,
        qty_done: (next === 'livraison' || next === 'facture') ? totalQty : Number(doc.qty_done || 0),
        doc_status: next === 'facture' ? 'closed' : (next === 'livraison' ? 'closed' : 'open')
      }
    : {
        stage: next,
        numbers_json: nums,
        received: next === 'reception' ? true : doc.received,
        qty_done: (next === 'reception' || next === 'facture') ? totalQty : Number(doc.qty_done || 0),
        doc_status: next === 'facture' ? 'closed' : (next === 'reception' ? 'closed' : 'open')
      };

  const { error: e2 } = await supabase.from(type).update(payload).eq('id', id);
  if (e2) throw new Error(e2.message);
}
async function payDoc(type, id, body) {
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  if (doc.stage !== 'facture') throw new Error('Le règlement est autorisé uniquement sur les factures');
  const payments = jsonValue(doc.payments_json, []);
  const info = paymentInfo(doc);
  const montant = Number(body.montant || info.rest || 0);
  if (montant <= 0) throw new Error('Montant de règlement invalide');
  payments.push({
    id: String(Date.now()), date: body.date || today(), mode: body.mode || 'Espèces', montant,
    cashRegister: body.cashRegister || '', receiptNo: body.receiptNo || '', chequeNo: body.chequeNo || '', bank: body.bank || '', dueDate: body.dueDate || '', paymentStatus: body.paymentStatus || '', transferRef: body.transferRef || '', valueDate: body.valueDate || '', terminal: body.terminal || '', transactionNo: body.transactionNo || '', billNo: body.billNo || '', note: body.note || ''
  });
  const { error: e2 } = await supabase.from(type).update({ payments_json: payments }).eq('id', id);
  if (e2) throw new Error(e2.message);
}

async function partialDoc(type, id, body) {
  const isSales = type === 'sales';
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single();
  if (error) throw new Error(error.message);

  if (doc.stage === 'facture') throw new Error('Action partielle non autorisée sur une facture');

  const next = isSales ? 'livraison' : 'reception';
  if (isSales && !['commande', 'livraison'].includes(doc.stage)) throw new Error('La livraison partielle se fait depuis une commande');
  if (!isSales && !['commande', 'reception'].includes(doc.stage)) throw new Error('La réception partielle se fait depuis une commande achat');

  const remaining = docRemainingQty(doc);
  const reqQty = Number(body.qte || 0);
  if (reqQty <= 0) throw new Error('Quantité invalide');
  if (remaining > 0 && reqQty > remaining) throw new Error('Quantité supérieure au reste');

  const lines = makePartialLines(doc, reqQty);
  const vatRate = Number(doc.vat_rate || 20);
  const t = computeTotals(lines, vatRate, isSales);

  const prefix = isSales ? 'BLV' : 'BRA';
  const key = isSales ? 'livraison' : 'reception';
  const numbers = { [key]: await nextNumber(prefix) };

  if (isSales) await updateStock(lines, -1, 'Livraison partielle vente ' + numbers[key]);
  else await updateStock(lines, 1, 'Réception partielle achat ' + numbers[key]);

  const session = getStoredSession();
  const newDone = Number(doc.qty_done || 0) + docQty(lines);
  const originalTotal = docQty(jsonValue(doc.lines_json, []));
  const status = newDone >= originalTotal ? 'closed' : 'partial';

  const payload = isSales ? {
    date: body.date || today(),
    client_id: doc.client_id,
    client_name: doc.client_name,
    stage: 'livraison',
    numbers_json: numbers,
    lines_json: lines,
    payments_json: [],
    vat_rate: vatRate,
    total_ht: t.totalHT,
    vat: t.vat,
    total_ttc: t.totalTTC,
    delivered: true,
    qty_done: docQty(lines),
    doc_status: status,
    created_by: session?.user?.id || null,
    base_doc_id: doc.id,
    branch_id: doc.branch_id || branchId(session)
  } : {
    date: body.date || today(),
    supplier_id: doc.supplier_id,
    supplier_name: doc.supplier_name,
    stage: 'reception',
    numbers_json: numbers,
    lines_json: lines,
    payments_json: [],
    vat_rate: vatRate,
    total_ht: t.totalHT,
    vat: t.vat,
    total_ttc: t.totalTTC,
    received: true,
    qty_done: docQty(lines),
    doc_status: status,
    created_by: session?.user?.id || null,
    base_doc_id: doc.id,
    branch_id: doc.branch_id || branchId(session)
  };

  const { error: e2 } = await supabase.from(type).insert(payload);
  if (e2) throw new Error(e2.message);

  const parentStatus = newDone >= originalTotal ? 'closed' : 'partial';
  const { error: e3 } = await supabase.from(type).update({
    qty_done: newDone,
    doc_status: parentStatus,
    delivered: isSales ? newDone >= originalTotal : doc.delivered,
    received: !isSales ? newDone >= originalTotal : doc.received
  }).eq('id', id);
  if (e3) throw new Error(e3.message);
}
async function loadPayments() {
  const [{ data: sales, error: e1 }, { data: purchases, error: e2 }] = await Promise.all([
    applyDocScope(supabase.from('sales').select('*'), 'sales', getStoredSession()).order('id', { ascending: false }),
    applyDocScope(supabase.from('purchases').select('*'), 'purchases', getStoredSession()).order('id', { ascending: false })
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  const enc = (sales || []).flatMap(d => jsonValue(d.payments_json, []).map(p => ({ type: 'encaissement', docType: 'vente', docId: d.id, docNumber: Object.values(jsonValue(d.numbers_json, {}))[0], tiers: d.client_name, ...p })));
  const dec = (purchases || []).flatMap(d => jsonValue(d.payments_json, []).map(p => ({ type: 'decaissement', docType: 'achat', docId: d.id, docNumber: Object.values(jsonValue(d.numbers_json, {}))[0], tiers: d.supplier_name, ...p })));
  return [...enc, ...dec].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

async function loadParties(type) {
  const { data, error } = await supabase.from(type).select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
}
async function saveParty(type, body) {
  const payload = type === 'clients'
    ? { name: body.name || '', type: body.type || 'entreprise', ice: body.ice || '', phone: body.phone || '', city: body.city || '', address: body.address || '' }
    : { name: body.name || '', ice: body.ice || '', phone: body.phone || '', city: body.city || '', contact: body.contact || '', address: body.address || '' };
  const q = body.id ? supabase.from(type).update(payload).eq('id', body.id) : supabase.from(type).insert(payload);
  const { error } = await q;
  if (error) throw new Error(error.message);
}
async function deleteParty(type, id) {
  const { error } = await supabase.from(type).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
async function loadUsers() {
  const { data, error } = await supabase.from('users').select('id, username, full_name, active, branch_id, branches(name), roles(name)').order('id');
  if (error) throw new Error(error.message);
  return (data || []).map(u => ({ id: u.id, username: u.username, full_name: u.full_name, active: u.active, role: u.roles?.name, branch_id: u.branch_id, branch_name: u.branches?.name || '' }));
}
async function loadRoles() {
  const { data, error } = await supabase.from('roles').select('*').order('id');
  if (error) throw new Error(error.message);
  return data || [];
}
async function saveUser(body) {
  const payload = {
    username: body.username || '',
    full_name: body.full_name || '',
    role_id: body.role_id || 3,
    branch_id: body.branch_id || null,
    active: body.active !== false
  };

  if (body.password) {
    payload.password_hash = body.password;
  }

  if (body.id) {
    const { error } = await supabase.from('users').update(payload).eq('id', body.id);
    if (error) throw new Error(error.message);
  } else {
    payload.password_hash = body.password || 'changeme';
    const { error } = await supabase.from('users').insert(payload);
    if (error) throw new Error(error.message);
  }
}

async function setUserActive(userId, active) {
  const { error } = await supabase.from('users').update({ active }).eq('id', userId);
  if (error) throw new Error(error.message);
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
    ['settings', L('settings'), 'settings.manage'],
    ['permissions', L('permissions'), 'permissions.manage'],
    ['branches', L('branches'), 'branches.manage'],
    ['clients', L('clients'), 'clients.read'],
    ['suppliers', L('suppliers'), 'suppliers.read'],
    ['users', L('users'), 'users.read']
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
            <button onClick={() => refreshCurrentSession(setSession)} className="btn bg-slate-800 w-full">Rafraîchir droits</button>
            <button onClick={() => { clearStoredSession(); setSession(null); }} className="btn bg-slate-800 w-full">{L('logout')}</button>
          </div>
        </aside>

        <main className="flex-1 p-6 max-w-[1500px] mx-auto w-full">
          {page === 'dashboard' ? <Dashboard L={L} /> : null}
          {page === 'products' ? <Products L={L} /> : null}
          {page === 'sales' ? <Docs L={L} type="sales" /> : null}
          {page === 'purchases' ? <Docs L={L} type="purchases" /> : null}
          {page === 'payments' ? <Payments L={L} /> : null}
          {page === 'settings' ? <Settings L={L} /> : null}
          {page === 'permissions' ? <Permissions L={L} /> : null}
          {page === 'branches' ? <Branches L={L} /> : null}
          {page === 'clients' ? <Parties L={L} type="clients" /> : null}
          {page === 'suppliers' ? <Parties L={L} type="suppliers" /> : null}
          {page === 'users' ? <Users L={L} /> : null}
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
        applyProductScope(supabase.from('products').select('*'), getStoredSession()),
        applyDocScope(supabase.from('sales').select('*'), 'sales', getStoredSession()),
        applyDocScope(supabase.from('purchases').select('*'), 'purchases', getStoredSession())
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

function Products({ L }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [stock, setStock] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const { data, error } = await applyProductScope(applyProductScope(supabase.from('products').select('*'), getStoredSession()), getStoredSession()).order('name');
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
        supplier_id: form.fournisseurId || null,
        branch_id: isAdmin(getStoredSession()) ? (form.branch_id || branchId(getStoredSession())) : branchId(getStoredSession())
      };

      const q = form.id ? supabase.from('products').update(payload).eq('id', form.id) : supabase.from('products').insert(payload);
      const { error } = await q;
      if (error) throw error;
      setForm(null);
      load();
    } catch (e) { alert(e.message); }
  }

  async function remove(id) {
    if (!confirm('Supprimer ?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert(error.message);
    load();
  }

  async function adjustStock() {
    try {
      await updateStock([{ produitId: stock.id, qte: Number(stock.qte) }], 1, stock.reason || L('stock'));
      setStock(null);
      load();
    } catch (e) { alert(e.message); }
  }

  if (err) return <ErrorBox msg={err} />;

  return (
    <>
      <Header title={L('products')}>
        <button onClick={() => setForm({ ref: '', nom: '', categorie: 'Divers', unite: 'Pièce', prixAchat: 0, prixVente: 0, quantite: 0, stockMin: 0 })} className="btn bg-amber-500">{L('new')}</button>
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
                <button onClick={() => setForm(p)} className="btn bg-white border">{L('edit')}</button>
                <button onClick={() => setStock({ ...p, qte: 1, reason: L('stock') })} className="btn bg-white border">{L('stock')}</button>
                <button onClick={() => remove(p.id)} className="btn bg-red-600 text-white">{L('del')}</button>
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

function Docs({ L, type }) {
  const isSales = type === 'sales';
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [parties, setParties] = useState([]);
  const [form, setForm] = useState(null);
  const [pay, setPay] = useState(null);
  const [partial, setPartial] = useState(null);
  const [preview, setPreview] = useState(null);
  const [tab, setTab] = useState('all');
  const [err, setErr] = useState('');

  async function load() {
    try {
      const [{ data: docs, error: dErr }, { data: prod, error: pErr }, { data: party, error: tErr }] = await Promise.all([
        applyDocScope(supabase.from(type).select('*'), type, getStoredSession()).order('id', { ascending: false }),
        applyProductScope(applyProductScope(supabase.from('products').select('*'), getStoredSession()), getStoredSession()).order('name'),
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
      await payDoc(type, pay.id, { date: pay.date, mode: pay.mode, montant: Number(pay.montant), cashRegister: pay.cashRegister, receiptNo: pay.receiptNo, chequeNo: pay.chequeNo, bank: pay.bank, dueDate: pay.dueDate, paymentStatus: pay.paymentStatus, transferRef: pay.transferRef, valueDate: pay.valueDate, terminal: pay.terminal, transactionNo: pay.transactionNo, billNo: pay.billNo, note: pay.note });
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
        <button onClick={() => create(isSales ? 'devis' : 'commande')} className="btn bg-white border">{L('create')}</button>
        <button onClick={() => create(isSales ? 'facture' : 'reception')} className="btn bg-amber-500">{L('direct')}</button>
      </Header>

      <div className="flex gap-1 mb-4 flex-wrap">
        {tabs.map(t => <button key={t[0]} onClick={() => setTab(t[0])} className={'px-3 py-1.5 rounded-lg text-sm ' + (tab === t[0] ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500')}>{t[1]}</button>)}
      </div>

      <Table>
        <thead>
          <tr><th>N°</th><th>{L('base')}</th><th>{L('date')}</th><th>{isSales ? L('customer') : L('supplier')}</th><th>{L('status')}</th><th>{L('quantity')}</th><th>{L('total')}</th><th>{L('payment')}</th><th>{L('actions')}</th></tr>
        </thead>
        <tbody>
          {filtered.map(d => {
            const status = d.statutPaiement === 'paid' ? L('paid') : d.statutPaiement === 'partial' ? L('partial') : L('unpaid');
            const tone = d.statutPaiement === 'paid' ? 'green' : d.statutPaiement === 'partial' ? 'amber' : 'red';
            return (
              <tr key={d.id}>
                <td className="font-mono text-xs">{docNo(d)}</td>
                <td>{d.baseDocId ? <Badge tone="blue">#{d.baseDocId}</Badge> : '-'}</td>
                <td>{d.date}</td>
                <td>{d.client_name || d.supplier_name || d.clientNom || d.fournisseurNom}</td>
                <td><Badge tone={docStatus(d) === 'closed' ? 'green' : docStatus(d) === 'partial' ? 'amber' : 'blue'}>{d.stage} · {docStatus(d) === 'closed' ? L('closed') : docStatus(d) === 'partial' ? L('partial') : L('open')}</Badge></td>
                <td className="text-xs">{L('quantity')}: {docQty(d.lignes)}<br />{L('remainingQty')}: {docRemainingQty(d)}</td>
                <td>{dh(d.totalTTC)}</td>
                <td><Badge tone={tone}>{status}{d.reste > 0 ? ' · ' + L('remaining') + ' ' + dh(d.reste) : ''}</Badge></td>
                <td className="flex gap-1 flex-wrap">
                  <button onClick={() => advance(d.id)} className="btn bg-slate-800 text-white">{L('advance')}</button>
                  <button onClick={() => setPreview(d)} className="btn bg-white border">{L('preview')}</button>
                  {paymentButtonVisible(d) ? <button onClick={() => setPay({ ...d, date: today(), mode: 'Espèces', montant: d.reste || d.totalTTC, cashRegister: '', receiptNo: '', chequeNo: '', bank: '', dueDate: '', paymentStatus: 'En portefeuille', transferRef: '', valueDate: '', terminal: '', transactionNo: '', billNo: '', note: '' })} className="btn bg-emerald-600 text-white">{L('pay')}</button> : null}
                  {d.stage !== 'facture' && docRemainingQty(d) > 0 ? <button onClick={() => setPartial({ doc: d, qte: docRemainingQty(d) || 1 })} className="btn bg-white border">{isSales ? L('partialDelivery') : L('partialReceipt')}</button> : null}
                  <button onClick={() => setForm({ id: d.id, start: d.stage, date: d.date, partyId: isSales ? d.client_id : d.supplier_id, lignes: (d.lignes || []).map(l => ({ produitId: l.produitId, qte: l.qte })) })} className="btn bg-white border">{L('edit')}</button>
                  <button onClick={() => remove(d.id)} className="btn bg-red-600 text-white">{L('del')}</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {form ? <DocModal L={L} isSales={isSales} form={form} setForm={setForm} products={products} parties={parties} save={save} close={() => setForm(null)} /> : null}
      {pay ? <PaymentModal L={L} isSales={isSales} pay={pay} setPay={setPay} save={settle} close={() => setPay(null)} /> : null}
      {partial ? <PartialModal L={L} isSales={isSales} partial={partial} setPartial={setPartial} save={doPartial} close={() => setPartial(null)} /> : null}
      {preview ? <DocumentPreview L={L} isSales={isSales} doc={preview} close={() => setPreview(null)} /> : null}
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


function DocumentPreview({ L, isSales, doc, close }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => setSettings({ company_name: 'DrogueriePro' }));
  }, []);

  const lines = doc.lignes || jsonValue(doc.lines_json, []);
  const vatRate = Number(doc.tauxTva || doc.vat_rate || settings?.vat_rate || 20);
  const docTotalTTC = Number(doc.totalTTC || doc.total_ttc || 0);
  const docTotalHT = Number(doc.totalHT || doc.total_ht || (docTotalTTC / (1 + vatRate / 100)));
  const docVAT = Number(doc.tva || doc.vat || (docTotalTTC - docTotalHT));
  const number = docNo(doc);
  const third = isSales ? (doc.client_name || doc.clientNom || '-') : (doc.supplier_name || doc.fournisseurNom || '-');

  function printDoc() {
    window.print();
  }

  if (!settings) return null;

  return (
    <Modal title={L('preview')} onClose={close} wide>
      <div className="print-area bg-white text-slate-900">
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-black">{settings.company_name || 'DrogueriePro'}</h1>
            <p className="text-sm text-slate-500">{settings.company_address || ''}</p>
            <p className="text-sm text-slate-500">
              {settings.company_phone ? 'Tél : ' + settings.company_phone : ''} {settings.company_ice ? ' · ICE : ' + settings.company_ice : ''}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">{isSales ? L('sales') : L('purchases')}</h2>
            <p className="font-mono">{number}</p>
            <p className="text-sm">{L('date')} : {doc.date || '-'}</p>
            <Badge tone={docStatus(doc) === 'closed' ? 'green' : docStatus(doc) === 'partial' ? 'amber' : 'blue'}>
              {doc.stage} · {docStatus(doc)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="card p-3">
            <p className="text-xs text-slate-400">{isSales ? L('customer') : L('supplier')}</p>
            <p className="font-bold">{third}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-slate-400">{L('payment')}</p>
            <p className="font-bold">
              {doc.statutPaiement === 'paid' ? L('paid') : doc.statutPaiement === 'partial' ? L('partial') : L('unpaid')}
            </p>
            <p className="text-sm text-slate-500">{L('remaining')} : {dh(doc.reste || 0)}</p>
          </div>
        </div>

        <table className="table w-full border">
          <thead>
            <tr>
              <th>{L('ref')}</th>
              <th>{L('product')}</th>
              <th>{L('quantity')}</th>
              <th>{L('unitPrice')}</th>
              <th>{L('totalHT')}</th>
              <th>{L('totalVAT')}</th>
              <th>{L('totalTTC')}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const qty = Number(l.qte || 0);
              const puTTC = Number(l.prixUnit || 0);
              const totalTTC = qty * puTTC;
              const totalHT = totalTTC / (1 + vatRate / 100);
              const vat = totalTTC - totalHT;
              return (
                <tr key={i}>
                  <td className="font-mono text-xs">{l.ref || '-'}</td>
                  <td>{l.nom || '-'}</td>
                  <td>{fmt(qty)}</td>
                  <td>{dh(puTTC)}</td>
                  <td>{dh(totalHT)}</td>
                  <td>{dh(vat)}</td>
                  <td className="font-bold">{dh(totalTTC)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end mt-5">
          <div className="w-80 card p-4">
            <div className="flex justify-between py-1">
              <span>{L('totalHT')}</span>
              <b>{dh(docTotalHT)}</b>
            </div>
            <div className="flex justify-between py-1">
              <span>{L('totalVAT')} {vatRate}%</span>
              <b>{dh(docVAT)}</b>
            </div>
            <div className="flex justify-between py-2 border-t mt-2 text-lg">
              <span>{L('totalTTC')}</span>
              <b>{dh(docTotalTTC)}</b>
            </div>
          </div>
        </div>

        {doc.baseDocId ? (
          <p className="text-xs text-slate-500 mt-4">{L('base')} : #{doc.baseDocId}</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 mt-5 no-print">
        <button onClick={close} className="btn bg-white border">Fermer</button>
        <button onClick={printDoc} className="btn bg-amber-500">{L('print')}</button>
      </div>
    </Modal>
  );
}


function PaymentModal({ L, isSales, pay, setPay, save, close }) {
  const mode = pay.mode || 'Espèces';
  function Field({ label, name, type = 'text' }) {
    return <label className="text-xs text-slate-500">{label}<input type={type} className="input mt-1 mb-2" value={pay[name] || ''} onChange={e => setPay({ ...pay, [name]: e.target.value })} /></label>;
  }
  function SelectField({ label, name, options }) {
    return <label className="text-xs text-slate-500">{label}<select className="input mt-1 mb-2" value={pay[name] || ''} onChange={e => setPay({ ...pay, [name]: e.target.value })}>{options.map(x => <option key={x} value={x}>{x}</option>)}</select></label>;
  }
  return (
    <Modal title={isSales ? L('cashIn') : L('cashOut')} onClose={close}>
      <p className="text-sm mb-2">{L('remaining')} : <b>{dh(pay.reste || 0)}</b></p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label={L('date')} name="date" type="date" />
        <label className="text-xs text-slate-500">Mode<select className="input mt-1 mb-2" value={mode} onChange={e => setPay({ ...pay, mode: e.target.value })}>{['Espèces', 'Chèque', 'Virement', 'Carte', 'Effet', 'Crédit'].map(x => <option key={x}>{x}</option>)}</select></label>
        <Field label="Montant" name="montant" type="number" />
        {mode === 'Espèces' && <><Field label={L('cashRegister')} name="cashRegister" /><Field label={L('receiptNo')} name="receiptNo" /></>}
        {mode === 'Chèque' && <><Field label={L('chequeNo')} name="chequeNo" /><Field label={L('bank')} name="bank" /><Field label={L('dueDate')} name="dueDate" type="date" /><SelectField label={L('paymentStatus')} name="paymentStatus" options={['En portefeuille','Déposé','Encaissé','Rejeté']} /></>}
        {mode === 'Virement' && <><Field label={L('bank')} name="bank" /><Field label={L('transferRef')} name="transferRef" /><Field label={L('valueDate')} name="valueDate" type="date" /></>}
        {mode === 'Carte' && <><Field label={L('terminal')} name="terminal" /><Field label={L('transactionNo')} name="transactionNo" /></>}
        {mode === 'Effet' && <><Field label={L('billNo')} name="billNo" /><Field label={L('bank')} name="bank" /><Field label={L('dueDate')} name="dueDate" type="date" /><SelectField label={L('paymentStatus')} name="paymentStatus" options={['En portefeuille','Déposé','Encaissé','Rejeté']} /></>}
        {mode === 'Crédit' && <><Field label={L('dueDate')} name="dueDate" type="date" /><Field label={L('note')} name="note" /></>}
      </div>
      <label className="text-xs text-slate-500">{L('note')}<textarea className="input mt-1" value={pay.note || ''} onChange={e => setPay({ ...pay, note: e.target.value })} /></label>
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

function Payments({ L }) {
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
              <td className="text-xs text-slate-500">{p.chequeNo ? 'Chèque: ' + p.chequeNo + ' · ' : ''}{p.billNo ? 'Effet: ' + p.billNo + ' · ' : ''}{p.bank ? p.bank + ' · ' : ''}{p.transferRef ? 'Vir: ' + p.transferRef + ' · ' : ''}{p.transactionNo ? 'Tx: ' + p.transactionNo + ' · ' : ''}{p.paymentStatus || p.receiptNo || p.cashRegister || p.note || '-'}</td>
              <td className="font-bold">{dh(p.montant)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

function Parties({ L, type }) {
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
        <button onClick={() => setForm({ name: '', ice: '', phone: '', city: '', address: '' })} className="btn bg-amber-500">{L('new')}</button>
      </Header>

      <div className="grid md:grid-cols-3 gap-3">
        {rows.map(x => (
          <div key={x.id} className="card p-4">
            <b>{x.name}</b>
            <p className="text-sm text-slate-500">ICE: {x.ice || '-'}<br />Tél: {x.phone || '-'}<br />{x.city || ''}</p>
            <div className="flex gap-1 mt-3">
              <button onClick={() => setForm(x)} className="btn bg-white border">{L('edit')}</button>
              <button onClick={() => remove(x.id)} className="btn bg-red-600 text-white">{L('del')}</button>
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

function Users({ L }) {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const [users, rolesData, branchesData] = await Promise.all([loadUsers(), loadRoles(), loadBranches()]);
      setRows(users);
      setRoles(rolesData);
      setBranches(branchesData);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  function newUser() {
    setForm({
      username: '',
      password: 'changeme',
      full_name: '',
      role_id: roles[0]?.id || 3,
      branch_id: branches[0]?.id || '',
      active: true
    });
  }

  function editUser(u) {
    const role = roles.find(r => r.name === u.role);
    setForm({
      id: u.id,
      username: u.username || '',
      password: '',
      full_name: u.full_name || '',
      role_id: role?.id || u.role_id || 3,
      branch_id: u.branch_id || '',
      active: u.active !== false
    });
  }

  async function save() {
    try {
      await saveUser(form);
      setForm(null);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function toggleActive(u) {
    if (!confirm((u.active ? L('deactivate') : L('activate')) + ' ?')) return;
    try {
      await setUserActive(u.id, !u.active);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (err) return <ErrorBox msg={err} />;

  return (
    <>
      <Header title={L('users')}>
        <button onClick={newUser} className="btn bg-amber-500">{L('new')}</button>
      </Header>

      <Table>
        <thead>
          <tr>
            <th>{L('username')}</th>
            <th>{L('fullName')}</th>
            <th>{L('role')}</th>
            <th>{L('branch')}</th>
            <th>{L('active')}</th>
            <th>{L('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id}>
              <td className="font-mono text-xs">{u.username}</td>
              <td>{u.full_name || '-'}</td>
              <td><Badge tone="blue">{u.role || '-'}</Badge></td>
              <td>{u.branch_name || '-'}</td>
              <td>
                <Badge tone={u.active ? 'green' : 'red'}>
                  {u.active ? L('active') : 'Inactif'}
                </Badge>
              </td>
              <td className="flex gap-1 flex-wrap">
                <button onClick={() => editUser(u)} className="btn bg-white border">{L('edit')}</button>
                <button onClick={() => toggleActive(u)} className={u.active ? 'btn bg-red-600 text-white' : 'btn bg-emerald-600 text-white'}>
                  {u.active ? L('deactivate') : L('activate')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {form ? (
        <Modal title={form.id ? L('edit') : L('new')} onClose={() => setForm(null)}>
          <label className="text-xs text-slate-500">{L('username')}
            <input className="input mt-1 mb-2" value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!!form.id} />
          </label>

          <label className="text-xs text-slate-500">{L('fullName')}
            <input className="input mt-1 mb-2" value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </label>

          <label className="text-xs text-slate-500">{form.id ? L('changePassword') : L('password')}
            <input className="input mt-1 mb-2" type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={form.id ? 'Laisser vide pour ne pas changer' : ''} />
          </label>

          <label className="text-xs text-slate-500">{L('role')}
            <select className="input mt-1 mb-2" value={form.role_id || ''} onChange={e => setForm({ ...form, role_id: Number(e.target.value) })}>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>

          <label className="text-xs text-slate-500">{L('branch')}
            <select className="input mt-1 mb-2" value={form.branch_id || ''} onChange={e => setForm({ ...form, branch_id: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Toutes / Aucune</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} />
            {L('active')}
          </label>

          <button onClick={save} className="btn bg-amber-500">{L('save')}</button>
        </Modal>
      ) : null}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
