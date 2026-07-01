import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export function can(perms, code) {
  return perms?.includes(code)
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

function parseBody(options) {
  try {
    return options.body ? JSON.parse(options.body) : {}
  } catch {
    return {}
  }
}

function asJson(v, fallback = []) {
  if (v === null || v === undefined || v === '') return fallback
  if (typeof v === 'string') {
    try { return JSON.parse(v) } catch { return fallback }
  }
  return v
}

function computeTotals(lines, vat = 20, priceIsTTC = true) {
  const base = (lines || []).reduce((s, l) => s + Number(l.prixUnit || 0) * Number(l.qte || 0), 0)
  if (priceIsTTC) {
    const totalTTC = base
    const totalHT = totalTTC / (1 + vat / 100)
    return { totalHT, vat: totalTTC - totalHT, totalTTC }
  }
  const totalHT = base
  return { totalHT, vat: totalHT * vat / 100, totalTTC: totalHT * (1 + vat / 100) }
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
    fournisseurNom: d.supplier_name
  }
}

async function nextNumber(prefix) {
  const { data } = await supabase
    .from('counters')
    .select('value')
    .eq('name', prefix)
    .maybeSingle()

  const n = Number(data?.value || 1)

  const { error } = await supabase
    .from('counters')
    .upsert({ name: prefix, value: n + 1 }, { onConflict: 'name' })

  if (error) throw new Error(error.message)

  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`
}

async function updateStock(lines, sign, reason) {
  for (const l of lines || []) {
    const productId = l.produitId || l.product_id || l.id
    const qty = Number(l.qte || l.quantity || 0)
    if (!productId || !qty) continue

    const { data: p, error: e1 } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', productId)
      .single()

    if (e1) throw new Error(e1.message)

    const newQty = Number(p.quantity || 0) + qty * sign

    const { error: e2 } = await supabase
      .from('products')
      .update({ quantity: newQty })
      .eq('id', productId)

    if (e2) throw new Error(e2.message)

    await supabase.from('stock_movements').insert({
      product_id: productId,
      quantity: qty * sign,
      reason,
      created_at: new Date().toISOString()
    })
  }
}

async function getPartyName(type, id, fallback = '') {
  if (!id) return fallback
  const table = type === 'sales' ? 'clients' : 'suppliers'
  const { data } = await supabase.from(table).select('name').eq('id', id).maybeSingle()
  return data?.name || fallback
}

async function createDoc(type, body) {
  const isSales = type === 'sales'
  const start = body.start || (isSales ? 'devis' : 'commande')
  const lines = body.lignes || []
  const vat = Number(body.tauxTva || body.vat_rate || 20)
  const totals = computeTotals(lines, vat, isSales)

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
        client_name: body.clientNom || body.client_name || await getPartyName(type, body.clientId || body.client_id),
        stage: start,
        numbers_json: numbers,
        lines_json: lines,
        payments_json: [],
        vat_rate: vat,
        total_ht: totals.totalHT,
        vat: totals.vat,
        total_ttc: totals.totalTTC,
        delivered: start === 'livraison' || start === 'facture',
        created_by: session?.user?.id || null
      }
    : {
        date: body.date || today(),
        supplier_id: body.fournisseurId || body.supplier_id || null,
        supplier_name: body.fournisseurNom || body.supplier_name || await getPartyName(type, body.fournisseurId || body.supplier_id),
        stage: start,
        numbers_json: numbers,
        lines_json: lines,
        payments_json: [],
        vat_rate: vat,
        total_ht: totals.totalHT,
        vat: totals.vat,
        total_ttc: totals.totalTTC,
        received: start === 'reception' || start === 'facture',
        created_by: session?.user?.id || null
      }

  const { data, error } = await supabase.from(type).insert(payload).select('id').single()
  if (error) throw new Error(error.message)

  return { id: data.id, numbers }
}

async function updateDoc(type, id, body) {
  const isSales = type === 'sales'
  const lines = body.lignes || body.lines_json || []
  const vat = Number(body.tauxTva || body.vat_rate || 20)
  const totals = computeTotals(lines, vat, isSales)

  const payload = {
    date: body.date || today(),
    lines_json: lines,
    vat_rate: vat,
    total_ht: totals.totalHT,
    vat: totals.vat,
    total_ttc: totals.totalTTC
  }

  if (isSales) {
    payload.client_id = body.clientId || body.client_id || null
    payload.client_name = body.clientNom || body.client_name || await getPartyName(type, payload.client_id)
  } else {
    payload.supplier_id = body.fournisseurId || body.supplier_id || null
    payload.supplier_name = body.fournisseurNom || body.supplier_name || await getPartyName(type, payload.supplier_id)
  }

  const { error } = await supabase.from(type).update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  return { ok: true }
}

async function deleteDoc(type, id) {
  const { data: doc, error: e1 } = await supabase.from(type).select('*').eq('id', id).single()
  if (e1) throw new Error(e1.message)

  const lines = asJson(doc.lines_json, [])

  if (type === 'sales' && doc.delivered) {
    await updateStock(lines, 1, 'Suppression vente - restitution stock')
  }

  if (type === 'purchases' && doc.received) {
    await updateStock(lines, -1, 'Suppression achat - retrait stock')
  }

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

  const prefixes = isSales
    ? { commande: 'BC', livraison: 'BL', facture: 'FAC' }
    : { reception: 'BR', facture: 'FF' }

  const keys = isSales
    ? { commande: 'commande', livraison: 'bl', facture: 'facture' }
    : { reception: 'reception', facture: 'facture' }

  const numbers = {
    ...asJson(doc.numbers_json, {}),
    [keys[next]]: await nextNumber(prefixes[next])
  }

  const lines = asJson(doc.lines_json, [])

  if (isSales && next === 'livraison' && !doc.delivered) {
    await updateStock(lines, -1, 'Livraison vente')
  }

  if (!isSales && next === 'reception' && !doc.received) {
    await updateStock(lines, 1, 'Réception achat')
  }

  const payload = isSales
    ? {
        stage: next,
        numbers_json: numbers,
        delivered: next === 'livraison' ? true : doc.delivered
      }
    : {
        stage: next,
        numbers_json: numbers,
        received: next === 'reception' ? true : doc.received
      }

  const { error: e2 } = await supabase.from(type).update(payload).eq('id', id)
  if (e2) throw new Error(e2.message)

  return { ok: true, stage: next, numbers }
}

async function payDoc(type, id, body) {
  const { data: doc, error } = await supabase.from(type).select('payments_json,total_ttc').eq('id', id).single()
  if (error) throw new Error(error.message)

  const payments = asJson(doc.payments_json, [])
  payments.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: body.date || today(),
    mode: body.mode || 'Espèces',
    montant: Number(body.montant || 0)
  })

  const { error: e2 } = await supabase.from(type).update({ payments_json: payments }).eq('id', id)
  if (e2) throw new Error(e2.message)

  return { ok: true }
}

async function partialDoc(type, id, body) {
  const isSales = type === 'sales'
  const mode = body.mode || (isSales ? 'livraison' : 'reception')

  const { data: doc, error } = await supabase.from(type).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)

  const originalLines = asJson(doc.lines_json, [])
  const requestedLines = body.lignes && body.lignes.length
    ? body.lignes
    : originalLines.map(l => ({
        ...l,
        qte: Number(body.qte || body.quantity || l.qte || 0)
      }))

  const vat = Number(doc.vat_rate || 20)
  const totals = computeTotals(requestedLines, vat, isSales)

  let stage, prefix, key
  if (isSales) {
    if (mode === 'facture' || mode === 'invoice') {
      stage = 'facture'; prefix = 'FAC'; key = 'facture'
    } else {
      stage = 'livraison'; prefix = 'BL'; key = 'bl'
      await updateStock(requestedLines, -1, 'Livraison partielle vente')
    }
  } else {
    if (mode === 'facture' || mode === 'invoice') {
      stage = 'facture'; prefix = 'FF'; key = 'facture'
    } else {
      stage = 'reception'; prefix = 'BR'; key = 'reception'
      await updateStock(requestedLines, 1, 'Réception partielle achat')
    }
  }

  const numbers = {
    ...asJson(doc.numbers_json, {}),
    [key]: await nextNumber(prefix)
  }

  const session = getSession()

  const payload = isSales
    ? {
        date: body.date || today(),
        client_id: doc.client_id,
        client_name: doc.client_name,
        stage,
        numbers_json: numbers,
        lines_json: requestedLines,
        payments_json: [],
        vat_rate: vat,
        total_ht: totals.totalHT,
        vat: totals.vat,
        total_ttc: totals.totalTTC,
        delivered: stage === 'livraison',
        created_by: session?.user?.id || null
      }
    : {
        date: body.date || today(),
        supplier_id: doc.supplier_id,
        supplier_name: doc.supplier_name,
        stage,
        numbers_json: numbers,
        lines_json: requestedLines,
        payments_json: [],
        vat_rate: vat,
        total_ht: totals.totalHT,
        vat: totals.vat,
        total_ttc: totals.totalTTC,
        received: stage === 'reception',
        created_by: session?.user?.id || null
      }

  const { data, error: e2 } = await supabase.from(type).insert(payload).select('id').single()
  if (e2) throw new Error(e2.message)

  return { ok: true, id: data.id, numbers, stage }
}

export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const body = parseBody(options)

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
      user: {
        id: data.id,
        username: data.username,
        full_name: data.full_name,
        role: data.roles?.name || 'Administrateur'
      },
      perms: ALL_PERMS
    }
  }

  if (path === '/me') {
    const session = getSession()
    return { user: session?.user, perms: session?.perms || [] }
  }

  if (path === '/dashboard') {
    const { data: products, error: pErr } = await supabase.from('products').select('*')
    if (pErr) throw new Error(pErr.message)

    const { data: sales, error: sErr } = await supabase.from('sales').select('*').eq('stage', 'facture')
    if (sErr) throw new Error(sErr.message)

    const { data: purchases, error: aErr } = await supabase.from('purchases').select('*').eq('stage', 'facture')
    if (aErr) throw new Error(aErr.message)

    return {
      products: products?.length || 0,
      lowStock: products?.filter(p => Number(p.quantity || 0) <= Number(p.min_stock || 0)).length || 0,
      stockValue: products?.reduce((s, p) => s + Number(p.quantity || 0) * Number(p.purchase_price || 0), 0) || 0,
      ca: sales?.reduce((s, x) => s + Number(x.total_ttc || 0), 0) || 0,
      dettes: purchases?.reduce((s, x) => s + Number(x.total_ttc || 0), 0) || 0
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
      category: body.categorie || body.category || 'Divers',
      unit: body.unite || body.unit || 'Pièce',
      purchase_price: Number(body.prixAchat || body.purchase_price || 0),
      sale_price: Number(body.prixVente || body.sale_price || 0),
      quantity: Number(body.quantite || body.quantity || 0),
      min_stock: Number(body.stockMin || body.min_stock || 0),
      supplier_id: body.fournisseurId || body.supplier_id || null
    }).select('id').single()

    if (error) throw new Error(error.message)
    return { id: data.id }
  }

  if (path.startsWith('/products/') && method === 'PUT') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('products').update({
      ref: body.ref || '',
      name: body.nom || body.name || '',
      category: body.categorie || body.category || 'Divers',
      unit: body.unite || body.unit || 'Pièce',
      purchase_price: Number(body.prixAchat || body.purchase_price || 0),
      sale_price: Number(body.prixVente || body.sale_price || 0),
      quantity: Number(body.quantite || body.quantity || 0),
      min_stock: Number(body.stockMin || body.min_stock || 0),
      supplier_id: body.fournisseurId || body.supplier_id || null
    }).eq('id', id)

    if (error) throw new Error(error.message)
    return { ok: true }
  }

  if (path.startsWith('/products/') && method === 'DELETE') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw new Error(error.message)
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

  if (path.startsWith('/clients/') && method === 'PUT') {
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

  if (path.startsWith('/clients/') && method === 'DELETE') {
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

  if (path.startsWith('/suppliers/') && method === 'PUT') {
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

  if (path.startsWith('/suppliers/') && method === 'DELETE') {
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

  if (path.match(/^\/sales\/\d+$/) && method === 'PUT') {
    const id = path.split('/')[2]
    return updateDoc('sales', id, body)
  }

  if (path.match(/^\/purchases\/\d+$/) && method === 'PUT') {
    const id = path.split('/')[2]
    return updateDoc('purchases', id, body)
  }

  if (path.match(/^\/sales\/\d+$/) && method === 'DELETE') {
    const id = path.split('/')[2]
    return deleteDoc('sales', id)
  }

  if (path.match(/^\/purchases\/\d+$/) && method === 'DELETE') {
    const id = path.split('/')[2]
    return deleteDoc('purchases', id)
  }

  if (path.match(/^\/sales\/\d+\/advance$/) && method === 'POST') {
    const id = path.split('/')[2]
    return advanceDoc('sales', id)
  }

  if (path.match(/^\/purchases\/\d+\/advance$/) && method === 'POST') {
    const id = path.split('/')[2]
    return advanceDoc('purchases', id)
  }

  if (path.match(/^\/sales\/\d+\/pay$/) && method === 'POST') {
    const id = path.split('/')[2]
    return payDoc('sales', id, body)
  }

  if (path.match(/^\/purchases\/\d+\/pay$/) && method === 'POST') {
    const id = path.split('/')[2]
    return payDoc('purchases', id, body)
  }

  if (path.match(/^\/sales\/\d+\/partial$/) && method === 'POST') {
    const id = path.split('/')[2]
    return partialDoc('sales', id, body)
  }

  if (path.match(/^\/purchases\/\d+\/partial$/) && method === 'POST') {
    const id = path.split('/')[2]
    return partialDoc('purchases', id, body)
  }

  if (path === '/users' && method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, active, roles(name)')
      .order('id')

    if (error) throw new Error(error.message)

    return (data || []).map(u => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      active: u.active,
      role: u.roles?.name
    }))
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
