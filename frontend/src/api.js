import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(
  SUPABASE_URL || 'https://example.supabase.co',
  SUPABASE_ANON_KEY || 'missing-key'
)

export function can(perms, code) {
  return Array.isArray(perms) && perms.includes(code)
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem('droguerie_session') || 'null')
  } catch {
    return null
  }
}

export function setSession(s) {
  localStorage.setItem('droguerie_session', JSON.stringify(s))
}

export function clearSession() {
  localStorage.removeItem('droguerie_session')
}

export const fmt = n =>
  (Number(n) || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

export const dh = n => fmt(n) + ' DH'

const today = () => new Date().toISOString().slice(0, 10)

const ALL_PERMS = [
  'dashboard.read',
  'products.read', 'products.write', 'products.delete',
  'clients.read', 'clients.write', 'clients.delete',
  'suppliers.read', 'suppliers.write', 'suppliers.delete',
  'sales.read', 'sales.write', 'sales.delete',
  'purchases.read', 'purchases.write', 'purchases.delete',
  'users.read', 'users.write'
]

function bodyOf(options) {
  try {
    return options.body ? JSON.parse(options.body) : {}
  } catch {
    return {}
  }
}

function asJson(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback
  if (typeof v === 'string') {
    try {
      return JSON.parse(v)
    } catch {
      return fallback
    }
  }
  return v
}

function totals(lines, vat = 20, priceIsTTC = true) {
  const base = (lines || []).reduce((s, l) => s + Number(l.prixUnit || 0) * Number(l.qte || 0), 0)
  if (priceIsTTC) {
    const totalTTC = base
    const totalHT = totalTTC / (1 + vat / 100)
    return { totalHT, vat: totalTTC - totalHT, totalTTC }
  }
  const totalHT = base
  return { totalHT, vat: totalHT * vat / 100, totalTTC: totalHT * (1 + vat / 100) }
}

function paidInfo(doc) {
  const payments = asJson(doc.payments_json || doc.paiements, [])
  const paid = payments.reduce((s, p) => s + Number(p.montant || 0), 0)
  const total = Number(doc.total_ttc ?? doc.totalTTC ?? 0)
  const rest = Math.max(0, total - paid)
  const status = paid <= 0.001 ? 'non_reglee' : rest <= 0.01 ? 'reglee' : 'partielle'
  return { paid, rest, status }
}

function mapProduct(p) {
  return {
    id: p.id,
    ref: p.ref,
    nom: p.name,
    categorie: p.category,
    unite: p.unit,
    prixAchat: Number(p.purchase_price || 0),
    prixVente: Number(p.sale_price || 0),
    quantite: Number(p.quantity || 0),
    stockMin: Number(p.min_stock || 0),
    fournisseurId: p.supplier_id
  }
}

function mapDoc(d) {
  const p = paidInfo(d)
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
  }
}

async function nextNumber(prefix) {
  const { data } = await supabase.from('counters').select('value').eq('name', prefix).maybeSingle()
  const n = Number(data?.value || 1)
  const { error } = await supabase.from('counters').upsert({ name: prefix, value: n + 1 }, { onConflict: 'name' })
  if (error) throw new Error(error.message)
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`
}

async function updateStock(lines, sign, reason) {
  for (const l of lines || []) {
    const productId = Number(l.produitId || l.product_id || l.id)
    const qty = Number(l.qte || l.quantity || 0)
    if (!productId || !qty) continue

    const { data: p, error: e1 } = await supabase.from('products').select('quantity').eq('id', productId).single()
    if (e1) throw new Error(e1.message)

    const newQty = Number(p.quantity || 0) + qty * sign

    const { error: e2 } = await supabase.from('products').update({ quantity: newQty }).eq('id', productId)
    if (e2) throw new Error(e2.message)

    await supabase.from('stock_movements').insert({
      product_id: productId,
      quantity: qty * sign,
      reason,
      created_at: new Date().toISOString()
    })
  }
}

async function partyName(type, id, fallback = '') {
  if (!id) return fallback
  const table = type === 'sales' ? 'clients' : 'suppliers'
  const { data } = await supabase.from(table).select('name').eq('id', id).maybeSingle()
  return data?.name || fallback
}

async function createDoc(type, body) {
  const isSales = type === 'sales'
  const start = body.start || (isSales ? 'devis' : 'commande')
  const lines = body.lignes || []
  const vat = Number(body.tauxTva || 20)
  const t = totals(lines, vat, isSales)

  let prefix, key
  if (isSales) {
    prefix = start === 'facture' ? 'FAC' : start === 'commande' ? 'BC' : start === 'livraison' ? 'BL' : 'DEV'
    key = start === 'facture' ? 'facture' : start === 'commande' ? 'commande' : start === 'livraison' ? 'bl' : 'devis'
  } else {
    prefix = start === 'facture' ? 'FF' : start === 'reception' ? 'BR' : 'CF'
    key = start === 'facture' ? 'facture' : start === 'reception' ? 'reception' : 'commande'
  }

  const numbers = { [key]: await nextNumber(prefix) }

  if (isSales && (start === 'livraison' || start === 'facture')) {
    await updateStock(lines, -1, start === 'facture' ? 'Vente directe' : 'Livraison vente')
  }

  if (!isSales && (start === 'reception' || start === 'facture')) {
    await updateStock(lines, 1, start === 'facture' ? 'Facture fournisseur directe' : 'Réception achat')
  }

  const session = getSession()

  const payload = isSales
    ? {
        date: body.date || today(),
        client_id: body.clientId || body.client_id || null,
        client_name: body.clientNom || body.client_name || await partyName(type, body.clientId || body.client_id),
        stage: start,
        numbers_json: numbers,
        lines_json: lines,
        payments_json: [],
        vat_rate: vat,
        total_ht: t.totalHT,
        vat: t.vat,
        total_ttc: t.totalTTC,
        delivered: start === 'livraison' || start === 'facture',
        created_by: session?.user?.id || null,
        base_doc_id: body.baseDocId || body.base_doc_id || null
      }
    : {
        date: body.date || today(),
        supplier_id: body.fournisseurId || body.supplier_id || null,
        supplier_name: body.fournisseurNom || body.supplier_name || await partyName(type, body.fournisseurId || body.supplier_id),
        stage: start,
        numbers_json: numbers,
        lines_json: lines,
        payments_json: [],
        vat_rate: vat,
        total_ht: t.totalHT,
        vat: t.vat,
        total_ttc: t.totalTTC,
        received: start === 'reception' || start === 'facture',
        created_by: session?.user?.id || null,
        base_doc_id: body.baseDocId || body.base_doc_id || null
      }

  const { data, error } = await supabase.from(type).insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  return { id: data.id, numbers }
}

async function updateDoc(type, id, body) {
  const isSales = type === 'sales'
  const lines = body.lignes || body.lines_json || []
  const vat = Number(body.tauxTva || body.vat_rate || 20)
  const t = totals(lines, vat, isSales)

  const payload = {
    date: body.date || today(),
    lines_json: lines,
    vat_rate: vat,
    total_ht: t.totalHT,
    vat: t.vat,
    total_ttc: t.totalTTC
  }

  if (isSales) {
    payload.client_id = body.clientId || body.client_id || null
    payload.client_name = body.clientNom || body.client_name || await partyName(type, payload.client_id)
  } else {
    payload.supplier_id = body.fournisseurId || body.supplier_id || null
    payload.supplier_name = body.fournisseurNom || body.supplier_name || await partyName(type, payload.supplier_id)
  }

  const { error } = await supabase.from(type).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  return { ok: true }
}

async function deleteDoc(type, id) {
  const { data: doc, error: e1 } = await supabase.from(type).select('*').eq('id', id).single()
  if (e1) throw new Error(e1.message)

  const lines = asJson(doc.lines_json, [])
  if (type === 'sales' && doc.delivered) await updateStock(lines, 1, 'Suppression vente - restitution stock')
  if (type === 'purchases' && doc.received) await updateStock(lines, -1, 'Suppression achat - retrait stock')

  const { error } = await supabase.from(type).delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { ok: true }
}

async function advanceDoc(type, id) {
  const isSales = type === 'sales'
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)

  const stages = isSales ? ['devis', 'commande', 'livraison', 'facture'] : ['commande', 'reception', 'facture']
  const next = stages[stages.indexOf(doc.stage) + 1]
  if (!next) return { ok: true }

  const prefixes = isSales ? { commande: 'BC', livraison: 'BL', facture: 'FAC' } : { reception: 'BR', facture: 'FF' }
  const keys = isSales ? { commande: 'commande', livraison: 'bl', facture: 'facture' } : { reception: 'reception', facture: 'facture' }
  const numbers = { ...asJson(doc.numbers_json, {}), [keys[next]]: await nextNumber(prefixes[next]) }

  const lines = asJson(doc.lines_json, [])
  if (isSales && next === 'livraison' && !doc.delivered) await updateStock(lines, -1, 'Livraison vente')
  if (!isSales && next === 'reception' && !doc.received) await updateStock(lines, 1, 'Réception achat')

  const payload = isSales
    ? { stage: next, numbers_json: numbers, delivered: next === 'livraison' ? true : doc.delivered }
    : { stage: next, numbers_json: numbers, received: next === 'reception' ? true : doc.received }

  const { error: e2 } = await supabase.from(type).update(payload).eq('id', id)
  if (e2) throw new Error(e2.message)
  return { ok: true, stage: next, numbers }
}

async function payDoc(type, id, body) {
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)

  const payments = asJson(doc.payments_json, [])
  const info = paidInfo(doc)
  const montant = Number(body.montant || info.rest || 0)
  if (montant <= 0) throw new Error('Montant de règlement invalide')

  payments.push({
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    date: body.date || today(),
    mode: body.mode || 'Espèces',
    montant
  })

  const { error: e2 } = await supabase.from(type).update({ payments_json: payments }).eq('id', id)
  if (e2) throw new Error(e2.message)
  return { ok: true }
}

async function partialDoc(type, id, body) {
  const isSales = type === 'sales'
  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)

  const original = asJson(doc.lines_json, [])
  const lines = (body.lignes && body.lignes.length
    ? body.lignes
    : original.map(l => ({ ...l, qte: Number(body.qte || l.qte || 0) }))
  ).filter(l => Number(l.qte) > 0)

  const vat = Number(doc.vat_rate || 20)
  const t = totals(lines, vat, isSales)

  const stage = isSales ? 'livraison' : 'reception'
  const prefix = isSales ? 'BL' : 'BR'
  const key = isSales ? 'bl' : 'reception'
  const numbers = { ...asJson(doc.numbers_json, {}), [key]: await nextNumber(prefix) }

  if (isSales) await updateStock(lines, -1, 'Livraison partielle vente')
  else await updateStock(lines, 1, 'Réception partielle achat')

  const session = getSession()

  const payload = isSales
    ? {
        date: body.date || today(),
        client_id: doc.client_id,
        client_name: doc.client_name,
        stage,
        numbers_json: numbers,
        lines_json: lines,
        payments_json: [],
        vat_rate: vat,
        total_ht: t.totalHT,
        vat: t.vat,
        total_ttc: t.totalTTC,
        delivered: true,
        created_by: session?.user?.id || null,
        base_doc_id: doc.id
      }
    : {
        date: body.date || today(),
        supplier_id: doc.supplier_id,
        supplier_name: doc.supplier_name,
        stage,
        numbers_json: numbers,
        lines_json: lines,
        payments_json: [],
        vat_rate: vat,
        total_ht: t.totalHT,
        vat: t.vat,
        total_ttc: t.totalTTC,
        received: true,
        created_by: session?.user?.id || null,
        base_doc_id: doc.id
      }

  const { data, error: e2 } = await supabase.from(type).insert(payload).select('id').single()
  if (e2) throw new Error(e2.message)
  return { ok: true, id: data.id, numbers, stage }
}

export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const body = bodyOf(options)

  if (path === '/auth/login' && method === 'POST') {
    const { username, password } = body
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, password_hash, active, roles(name)')
      .eq('username', username)
      .eq('active', true)
      .single()

    if (error || !data) throw new Error('Identifiant incorrect')
    if (password !== data.password_hash) throw new Error('Mot de passe incorrect')

    return {
      token: 'supabase',
      user: { id: data.id, username: data.username, full_name: data.full_name, role: data.roles?.name || 'Administrateur' },
      perms: ALL_PERMS
    }
  }

  if (path === '/me') {
    const s = getSession()
    return { user: s?.user, perms: s?.perms || [] }
  }

  if (path === '/dashboard') {
    const [{ data: products, error: pErr }, { data: sales, error: sErr }, { data: purchases, error: aErr }] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('sales').select('*'),
      supabase.from('purchases').select('*')
    ])
    if (pErr) throw new Error(pErr.message)
    if (sErr) throw new Error(sErr.message)
    if (aErr) throw new Error(aErr.message)

    const factures = (sales || []).filter(x => x.stage === 'facture')
    const factAch = (purchases || []).filter(x => x.stage === 'facture')

    return {
      products: products?.length || 0,
      lowStock: products?.filter(p => Number(p.quantity) <= Number(p.min_stock)).length || 0,
      stockValue: products?.reduce((s, p) => s + Number(p.quantity || 0) * Number(p.purchase_price || 0), 0) || 0,
      ca: factures.reduce((s, x) => s + Number(x.total_ttc || 0), 0),
      dettes: factAch.reduce((s, x) => s + paidInfo(x).rest, 0)
    }
  }

  if (path === '/products' && method === 'GET') {
    const { data, error } = await supabase.from('products').select('*').order('name')
    if (error) throw new Error(error.message)
    return (data || []).map(mapProduct)
  }

  if (path === '/products' && method === 'POST') {
    const { data, error } = await supabase.from('products').insert({
      ref: body.ref || '',
      name: body.nom || body.name || '',
      category: body.categorie || 'Divers',
      unit: body.unite || 'Pièce',
      purchase_price: Number(body.prixAchat || 0),
      sale_price: Number(body.prixVente || 0),
      quantity: Number(body.quantite || 0),
      min_stock: Number(body.stockMin || 0),
      supplier_id: body.fournisseurId || null
    }).select('id').single()
    if (error) throw new Error(error.message)
    return { id: data.id }
  }

  if (path.match(/^\/products\/\d+$/) && method === 'PUT') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('products').update({
      ref: body.ref || '',
      name: body.nom || body.name || '',
      category: body.categorie || 'Divers',
      unit: body.unite || 'Pièce',
      purchase_price: Number(body.prixAchat || 0),
      sale_price: Number(body.prixVente || 0),
      quantity: Number(body.quantite || 0),
      min_stock: Number(body.stockMin || 0),
      supplier_id: body.fournisseurId || null
    }).eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }

  if (path.match(/^\/products\/\d+$/) && method === 'DELETE') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }

  if (path.match(/^\/products\/\d+\/stock$/) && method === 'POST') {
    const id = Number(path.split('/')[2])
    await updateStock([{ produitId: id, qte: Number(body.qte || body.quantity || 0) }], 1, body.reason || 'Ajustement stock')
    return { ok: true }
  }

  if (path === '/clients' && method === 'GET') {
    const { data, error } = await supabase.from('clients').select('*').order('name')
    if (error) throw new Error(error.message)
    return data || []
  }

  if (path === '/clients' && method === 'POST') {
    const { data, error } = await supabase.from('clients').insert({
      name: body.name || body.nom || '',
      type: body.type || 'entreprise',
      ice: body.ice || '',
      phone: body.phone || body.tel || '',
      city: body.city || body.ville || '',
      address: body.address || body.adresse || ''
    }).select('id').single()
    if (error) throw new Error(error.message)
    return { id: data.id }
  }

  if (path.match(/^\/clients\/\d+$/) && method === 'PUT') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('clients').update({
      name: body.name || body.nom || '',
      type: body.type || 'entreprise',
      ice: body.ice || '',
      phone: body.phone || body.tel || '',
      city: body.city || body.ville || '',
      address: body.address || body.adresse || ''
    }).eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }

  if (path.match(/^\/clients\/\d+$/) && method === 'DELETE') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }

  if (path === '/suppliers' && method === 'GET') {
    const { data, error } = await supabase.from('suppliers').select('*').order('name')
    if (error) throw new Error(error.message)
    return data || []
  }

  if (path === '/suppliers' && method === 'POST') {
    const { data, error } = await supabase.from('suppliers').insert({
      name: body.name || body.nom || '',
      ice: body.ice || '',
      phone: body.phone || body.tel || '',
      city: body.city || body.ville || '',
      contact: body.contact || '',
      address: body.address || body.adresse || ''
    }).select('id').single()
    if (error) throw new Error(error.message)
    return { id: data.id }
  }

  if (path.match(/^\/suppliers\/\d+$/) && method === 'PUT') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('suppliers').update({
      name: body.name || body.nom || '',
      ice: body.ice || '',
      phone: body.phone || body.tel || '',
      city: body.city || body.ville || '',
      contact: body.contact || '',
      address: body.address || body.adresse || ''
    }).eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }

  if (path.match(/^\/suppliers\/\d+$/) && method === 'DELETE') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }

  if (path === '/sales' && method === 'GET') {
    const { data, error } = await supabase.from('sales').select('*').order('id', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(mapDoc)
  }

  if (path === '/purchases' && method === 'GET') {
    const { data, error } = await supabase.from('purchases').select('*').order('id', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(mapDoc)
  }

  if (path === '/sales' && method === 'POST') return createDoc('sales', body)
  if (path === '/purchases' && method === 'POST') return createDoc('purchases', body)
  if (path.match(/^\/sales\/\d+$/) && method === 'PUT') return updateDoc('sales', path.split('/')[2], body)
  if (path.match(/^\/purchases\/\d+$/) && method === 'PUT') return updateDoc('purchases', path.split('/')[2], body)
  if (path.match(/^\/sales\/\d+$/) && method === 'DELETE') return deleteDoc('sales', path.split('/')[2])
  if (path.match(/^\/purchases\/\d+$/) && method === 'DELETE') return deleteDoc('purchases', path.split('/')[2])
  if (path.match(/^\/sales\/\d+\/advance$/) && method === 'POST') return advanceDoc('sales', path.split('/')[2])
  if (path.match(/^\/purchases\/\d+\/advance$/) && method === 'POST') return advanceDoc('purchases', path.split('/')[2])
  if (path.match(/^\/sales\/\d+\/pay$/) && method === 'POST') return payDoc('sales', path.split('/')[2], body)
  if (path.match(/^\/purchases\/\d+\/pay$/) && method === 'POST') return payDoc('purchases', path.split('/')[2], body)
  if (path.match(/^\/sales\/\d+\/partial$/) && method === 'POST') return partialDoc('sales', path.split('/')[2], body)
  if (path.match(/^\/purchases\/\d+\/partial$/) && method === 'POST') return partialDoc('purchases', path.split('/')[2], body)

  if (path === '/payments' && method === 'GET') {
    const [{ data: sales, error: e1 }, { data: purchases, error: e2 }] = await Promise.all([
      supabase.from('sales').select('*').order('id', { ascending: false }),
      supabase.from('purchases').select('*').order('id', { ascending: false })
    ])
    if (e1) throw new Error(e1.message)
    if (e2) throw new Error(e2.message)

    const enc = (sales || []).flatMap(d => asJson(d.payments_json, []).map(p => ({
      type: 'encaissement',
      docType: 'vente',
      docId: d.id,
      docNumber: Object.values(asJson(d.numbers_json, {}))[0],
      tiers: d.client_name,
      ...p
    })))

    const dec = (purchases || []).flatMap(d => asJson(d.payments_json, []).map(p => ({
      type: 'decaissement',
      docType: 'achat',
      docId: d.id,
      docNumber: Object.values(asJson(d.numbers_json, {}))[0],
      tiers: d.supplier_name,
      ...p
    })))

    return [...enc, ...dec].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }

  if (path === '/users' && method === 'GET') {
    const { data, error } = await supabase.from('users').select('id, username, full_name, active, roles(name)').order('id')
    if (error) throw new Error(error.message)
    return (data || []).map(u => ({ id: u.id, username: u.username, full_name: u.full_name, active: u.active, role: u.roles?.name }))
  }

  if (path === '/users' && method === 'POST') {
    const { data, error } = await supabase.from('users').insert({
      username: body.username,
      password_hash: body.password || 'changeme',
      full_name: body.full_name || '',
      role_id: body.role_id,
      active: true
    }).select('id').single()
    if (error) throw new Error(error.message)
    return { id: data.id }
  }

  if (path === '/roles' && method === 'GET') {
    const { data, error } = await supabase.from('roles').select('*').order('id')
    if (error) throw new Error(error.message)
    return data || []
  }

  throw new Error('Fonction Supabase non migrée : ' + method + ' ' + path)
}
