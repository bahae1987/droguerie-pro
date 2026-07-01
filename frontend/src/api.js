import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export function can(perms, code) { return perms?.includes(code) }
export function getSession() { try { return JSON.parse(localStorage.getItem('droguerie_session') || 'null') } catch { return null } }
export function setSession(s) { localStorage.setItem('droguerie_session', JSON.stringify(s)) }
export function clearSession() { localStorage.removeItem('droguerie_session') }
export const fmt = n => (Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const dh = n => fmt(n) + ' DH'

const DEFAULT_PERMS = [
  'dashboard.read',
  'products.read','products.write','products.delete',
  'clients.read','clients.write','clients.delete',
  'suppliers.read','suppliers.write','suppliers.delete',
  'sales.read','sales.write','sales.delete',
  'purchases.read','purchases.write','purchases.delete',
  'users.read','users.write','users.delete'
]

const year = () => new Date().getFullYear()
const toJson = v => typeof v === 'string' ? JSON.parse(v || '[]') : (v || [])
const getBody = options => options.body ? JSON.parse(options.body) : {}
const okOrThrow = ({ error }) => { if (error) throw new Error(error.message) }

function totals(lines = [], vat = 20, ttcPrices = true) {
  const base = lines.reduce((s, l) => s + (Number(l.prixUnit) || 0) * (Number(l.qte) || 0), 0)
  if (ttcPrices) {
    const total_ttc = base
    const total_ht = base / (1 + vat / 100)
    return { total_ht, vat: total_ttc - total_ht, total_ttc }
  }
  const total_ht = base
  return { total_ht, vat: total_ht * vat / 100, total_ttc: total_ht * (1 + vat / 100) }
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

function dbProduct(p) {
  return {
    ref: p.ref || '',
    name: p.nom || p.name || '',
    category: p.categorie || p.category || 'Divers',
    unit: p.unite || p.unit || 'Pièce',
    purchase_price: Number(p.prixAchat ?? p.purchase_price ?? 0),
    sale_price: Number(p.prixVente ?? p.sale_price ?? 0),
    quantity: Number(p.quantite ?? p.quantity ?? 0),
    min_stock: Number(p.stockMin ?? p.min_stock ?? 0),
    supplier_id: p.fournisseurId || p.supplier_id || null
  }
}

function mapDoc(x) {
  return {
    ...x,
    numeros: toJson(x.numbers_json || {}),
    lignes: toJson(x.lines_json || []),
    paiements: toJson(x.payments_json || [])
  }
}

async function nextNumber(prefix) {
  const { data } = await supabase.from('counters').select('value').eq('name', prefix).maybeSingle()
  const n = Number(data?.value || 1)
  const number = `${prefix}-${year()}-${String(n).padStart(4, '0')}`
  const { error } = await supabase.from('counters').upsert({ name: prefix, value: n + 1 }, { onConflict: 'name' })
  if (error) throw new Error(error.message)
  return number
}

async function updateStock(lines = [], sign = 1) {
  for (const l of lines) {
    const id = l.produitId || l.product_id || l.id
    const qte = Number(l.qte || l.quantity || 0)
    if (!id || !qte) continue
    const { data: p, error: e1 } = await supabase.from('products').select('quantity').eq('id', id).single()
    if (e1) throw new Error(e1.message)
    const { error: e2 } = await supabase.from('products').update({ quantity: Number(p.quantity || 0) + qte * sign }).eq('id', id)
    if (e2) throw new Error(e2.message)
    await supabase.from('stock_movements').insert({ product_id: id, quantity: qte * sign, reason: sign > 0 ? 'Entrée stock' : 'Sortie stock' }).then(okOrThrow)
  }
}

function mergePartial(lines = [], partial = [], field) {
  return lines.map(l => {
    const p = partial.find(x => String(x.produitId || x.product_id || x.id) === String(l.produitId || l.product_id || l.id))
    const oldVal = Number(l[field] || 0)
    const addVal = Number(p?.qte || p?.quantity || 0)
    return p ? { ...l, [field]: Math.min(Number(l.qte || l.quantity || 0), oldVal + addVal) } : l
  })
}

function allDone(lines = [], field) {
  return lines.every(l => Number(l[field] || 0) >= Number(l.qte || l.quantity || 0))
}

export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const body = getBody(options)

  // Auth simplifiée sans backend. Pour production réelle, activer Supabase Auth.
  if (path === '/auth/login' && method === 'POST') {
    const { username, password } = body
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, password_hash, active, roles(name)')
      .eq('username', username)
      .eq('active', true)
      .maybeSingle()
    if (error || !data) throw new Error('Identifiant incorrect')
    if (password !== data.password_hash) throw new Error('Mot de passe incorrect')
    return {
      token: 'supabase-direct',
      user: { id: data.id, username: data.username, full_name: data.full_name, role: data.roles?.name || 'Administrateur' },
      perms: DEFAULT_PERMS
    }
  }

  if (path === '/me') return getSession()

  // Dashboard
  if (path === '/dashboard' && method === 'GET') {
    const { data: products, error: ep } = await supabase.from('products').select('*')
    if (ep) throw new Error(ep.message)
    const { data: sales, error: es } = await supabase.from('sales').select('*').eq('stage', 'facture')
    if (es) throw new Error(es.message)
    const { data: purchases, error: ea } = await supabase.from('purchases').select('*').eq('stage', 'facture')
    if (ea) throw new Error(ea.message)
    return {
      products: products.length,
      lowStock: products.filter(p => Number(p.quantity) <= Number(p.min_stock)).length,
      stockValue: products.reduce((s, p) => s + Number(p.quantity || 0) * Number(p.purchase_price || 0), 0),
      ca: sales.reduce((s, x) => s + Number(x.total_ttc || 0), 0),
      purchases: purchases.reduce((s, x) => s + Number(x.total_ttc || 0), 0)
    }
  }


  // Mouvements de stock
  if (path === '/stock-movements' && method === 'GET') {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('id, product_id, quantity, reason, created_at, products(name)')
      .order('id', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return data
  }
  if (path.match(/^\/products\/\d+\/stock$/) && method === 'POST') {
    const id = path.split('/')[2]
    const qte = Number(body.qte || body.quantity || 0)
    if (!qte) return { ok: true }
    const { data: p, error: e1 } = await supabase.from('products').select('quantity').eq('id', id).single()
    if (e1) throw new Error(e1.message)
    const { error: e2 } = await supabase.from('products').update({ quantity: Number(p.quantity || 0) + qte }).eq('id', id)
    if (e2) throw new Error(e2.message)
    await supabase.from('stock_movements').insert({ product_id: id, quantity: qte, reason: body.reason || 'Ajustement manuel' }).then(okOrThrow)
    return { ok: true }
  }

  // Produits
  if (path === '/products' && method === 'GET') {
    const { data, error } = await supabase.from('products').select('*').order('name')
    if (error) throw new Error(error.message)
    return data.map(mapProduct)
  }
  if (path === '/products' && method === 'POST') {
    const { data, error } = await supabase.from('products').insert(dbProduct(body)).select('id').single()
    if (error) throw new Error(error.message)
    return { id: data.id, ok: true }
  }
  if (path.startsWith('/products/') && method === 'PUT') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('products').update(dbProduct(body)).eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }
  if (path.startsWith('/products/') && method === 'DELETE') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }

  // Clients / Fournisseurs
  if (path === '/clients' && method === 'GET') {
    const { data, error } = await supabase.from('clients').select('*').order('name')
    if (error) throw new Error(error.message)
    return data
  }
  if (path === '/clients' && method === 'POST') {
    const { data, error } = await supabase.from('clients').insert({
      name: body.name || body.nom || '', type: body.type || '', ice: body.ice || '',
      phone: body.phone || body.tel || '', city: body.city || body.ville || '', address: body.address || body.adresse || ''
    }).select('id').single()
    if (error) throw new Error(error.message)
    return { id: data.id, ok: true }
  }
  if (path.startsWith('/clients/') && method === 'PUT') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('clients').update({
      name: body.name || body.nom || '', type: body.type || '', ice: body.ice || '',
      phone: body.phone || body.tel || '', city: body.city || body.ville || '', address: body.address || body.adresse || ''
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
    return data
  }
  if (path === '/suppliers' && method === 'POST') {
    const { data, error } = await supabase.from('suppliers').insert({
      name: body.name || body.nom || '', ice: body.ice || '', phone: body.phone || body.tel || '',
      city: body.city || body.ville || '', contact: body.contact || '', address: body.address || body.adresse || ''
    }).select('id').single()
    if (error) throw new Error(error.message)
    return { id: data.id, ok: true }
  }
  if (path.startsWith('/suppliers/') && method === 'PUT') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('suppliers').update({
      name: body.name || body.nom || '', ice: body.ice || '', phone: body.phone || body.tel || '',
      city: body.city || body.ville || '', contact: body.contact || '', address: body.address || body.adresse || ''
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

  // Ventes
  if (path === '/sales' && method === 'GET') {
    const { data, error } = await supabase.from('sales').select('*').order('id', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(mapDoc)
  }
  if (path === '/sales' && method === 'POST') {
    const start = body.start || 'devis'
    const key = start === 'facture' ? 'facture' : start
    const prefix = start === 'facture' ? 'FAC' : start === 'commande' ? 'BC' : start === 'livraison' ? 'BL' : 'DEV'
    const numbers = { [key]: await nextNumber(prefix) }
    const t = totals(body.lignes || [], body.tauxTva || 20, true)
    if (start === 'facture' || start === 'livraison') await updateStock(body.lignes || [], -1)
    const lines = (body.lignes || []).map(l => ({ ...l, delivered_qty: start === 'facture' || start === 'livraison' ? Number(l.qte || 0) : 0, invoiced_qty: start === 'facture' ? Number(l.qte || 0) : 0 }))
    const { data, error } = await supabase.from('sales').insert({
      date: body.date, client_id: body.clientId, client_name: body.clientNom,
      stage: start, numbers_json: numbers, lines_json: lines, payments_json: [],
      vat_rate: body.tauxTva || 20, total_ht: t.total_ht, vat: t.vat, total_ttc: t.total_ttc,
      delivered: start === 'facture' || start === 'livraison'
    }).select('id').single()
    if (error) throw new Error(error.message)
    return { id: data.id, numbers }
  }
  if (path.match(/^\/sales\/\d+$/) && method === 'DELETE') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('sales').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }
  if (path.match(/^\/sales\/\d+\/advance$/) && method === 'POST') {
    const id = path.split('/')[2]
    const { data: doc, error } = await supabase.from('sales').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    const stages = ['devis', 'commande', 'livraison', 'facture']
    const next = stages[stages.indexOf(doc.stage) + 1]
    if (!next) return { ok: true }
    const prefixes = { commande: 'BC', livraison: 'BL', facture: 'FAC' }
    const keys = { commande: 'commande', livraison: 'bl', facture: 'facture' }
    const lines = toJson(doc.lines_json)
    const numbers = { ...toJson(doc.numbers_json || {}), [keys[next]]: await nextNumber(prefixes[next]) }
    let newLines = lines
    if (next === 'livraison' && !doc.delivered) {
      await updateStock(lines, -1)
      newLines = lines.map(l => ({ ...l, delivered_qty: Number(l.qte || 0) }))
    }
    if (next === 'facture') newLines = newLines.map(l => ({ ...l, invoiced_qty: Number(l.qte || 0) }))
    await supabase.from('sales').update({ stage: next, numbers_json: numbers, lines_json: newLines, delivered: next === 'livraison' ? true : doc.delivered }).eq('id', id).then(okOrThrow)
    return { ok: true, stage: next, numbers }
  }
  if (path.match(/^\/sales\/\d+\/pay$/) && method === 'POST') {
    const id = path.split('/')[2]
    const { data: doc, error } = await supabase.from('sales').select('payments_json').eq('id', id).single()
    if (error) throw new Error(error.message)
    const payments = toJson(doc.payments_json)
    payments.push(body)
    await supabase.from('sales').update({ payments_json: payments }).eq('id', id).then(okOrThrow)
    return { ok: true }
  }
  // Livraison partielle : body = { lignes:[{produitId, qte}] }
  if (path.match(/^\/sales\/\d+\/deliver$/) && method === 'POST') {
    const id = path.split('/')[2]
    const { data: doc, error } = await supabase.from('sales').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    const partial = body.lignes || []
    await updateStock(partial, -1)
    const lines = mergePartial(toJson(doc.lines_json), partial, 'delivered_qty')
    const numbers = toJson(doc.numbers_json || {})
    if (!numbers.bl) numbers.bl = await nextNumber('BL')
    await supabase.from('sales').update({ stage: allDone(lines, 'delivered_qty') ? 'livraison' : doc.stage, numbers_json: numbers, lines_json: lines, delivered: allDone(lines, 'delivered_qty') }).eq('id', id).then(okOrThrow)
    return { ok: true, partial: true, numbers }
  }
  // Facturation partielle vente : body = { lignes:[{produitId, qte}] }
  if (path.match(/^\/sales\/\d+\/invoice$/) && method === 'POST') {
    const id = path.split('/')[2]
    const { data: doc, error } = await supabase.from('sales').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    const lines = mergePartial(toJson(doc.lines_json), body.lignes || [], 'invoiced_qty')
    const numbers = toJson(doc.numbers_json || {})
    if (!numbers.facture) numbers.facture = await nextNumber('FAC')
    await supabase.from('sales').update({ stage: allDone(lines, 'invoiced_qty') ? 'facture' : doc.stage, numbers_json: numbers, lines_json: lines }).eq('id', id).then(okOrThrow)
    return { ok: true, partial: true, numbers }
  }

  // Achats
  if (path === '/purchases' && method === 'GET') {
    const { data, error } = await supabase.from('purchases').select('*').order('id', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(mapDoc)
  }
  if (path === '/purchases' && method === 'POST') {
    const start = body.start || 'commande'
    const key = start === 'reception' ? 'reception' : start
    const prefix = start === 'reception' ? 'BR' : start === 'facture' ? 'FF' : 'CF'
    const numbers = { [key]: await nextNumber(prefix) }
    const t = totals(body.lignes || [], body.tauxTva || 20, false)
    if (start === 'reception' || start === 'facture') await updateStock(body.lignes || [], 1)
    const lines = (body.lignes || []).map(l => ({ ...l, received_qty: start === 'reception' || start === 'facture' ? Number(l.qte || 0) : 0, invoiced_qty: start === 'facture' ? Number(l.qte || 0) : 0 }))
    const { data, error } = await supabase.from('purchases').insert({
      date: body.date, supplier_id: body.fournisseurId, supplier_name: body.fournisseurNom,
      stage: start, numbers_json: numbers, lines_json: lines, payments_json: [],
      vat_rate: body.tauxTva || 20, total_ht: t.total_ht, vat: t.vat, total_ttc: t.total_ttc,
      received: start === 'reception' || start === 'facture'
    }).select('id').single()
    if (error) throw new Error(error.message)
    return { id: data.id, numbers }
  }
  if (path.match(/^\/purchases\/\d+$/) && method === 'DELETE') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('purchases').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }
  if (path.match(/^\/purchases\/\d+\/advance$/) && method === 'POST') {
    const id = path.split('/')[2]
    const { data: doc, error } = await supabase.from('purchases').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    const stages = ['commande', 'reception', 'facture']
    const next = stages[stages.indexOf(doc.stage) + 1]
    if (!next) return { ok: true }
    const prefixes = { reception: 'BR', facture: 'FF' }
    const keys = { reception: 'reception', facture: 'facture' }
    const lines = toJson(doc.lines_json)
    const numbers = { ...toJson(doc.numbers_json || {}), [keys[next]]: await nextNumber(prefixes[next]) }
    let newLines = lines
    if (next === 'reception' && !doc.received) {
      await updateStock(lines, 1)
      newLines = lines.map(l => ({ ...l, received_qty: Number(l.qte || 0) }))
    }
    if (next === 'facture') newLines = newLines.map(l => ({ ...l, invoiced_qty: Number(l.qte || 0) }))
    await supabase.from('purchases').update({ stage: next, numbers_json: numbers, lines_json: newLines, received: next === 'reception' ? true : doc.received }).eq('id', id).then(okOrThrow)
    return { ok: true, stage: next, numbers }
  }
  if (path.match(/^\/purchases\/\d+\/pay$/) && method === 'POST') {
    const id = path.split('/')[2]
    const { data: doc, error } = await supabase.from('purchases').select('payments_json').eq('id', id).single()
    if (error) throw new Error(error.message)
    const payments = toJson(doc.payments_json)
    payments.push(body)
    await supabase.from('purchases').update({ payments_json: payments }).eq('id', id).then(okOrThrow)
    return { ok: true }
  }
  // Réception partielle achat : body = { lignes:[{produitId, qte}] }
  if (path.match(/^\/purchases\/\d+\/receive$/) && method === 'POST') {
    const id = path.split('/')[2]
    const { data: doc, error } = await supabase.from('purchases').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    const partial = body.lignes || []
    await updateStock(partial, 1)
    const lines = mergePartial(toJson(doc.lines_json), partial, 'received_qty')
    const numbers = toJson(doc.numbers_json || {})
    if (!numbers.reception) numbers.reception = await nextNumber('BR')
    await supabase.from('purchases').update({ stage: allDone(lines, 'received_qty') ? 'reception' : doc.stage, numbers_json: numbers, lines_json: lines, received: allDone(lines, 'received_qty') }).eq('id', id).then(okOrThrow)
    return { ok: true, partial: true, numbers }
  }
  // Facturation partielle fournisseur : body = { lignes:[{produitId, qte}] }
  if (path.match(/^\/purchases\/\d+\/invoice$/) && method === 'POST') {
    const id = path.split('/')[2]
    const { data: doc, error } = await supabase.from('purchases').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    const lines = mergePartial(toJson(doc.lines_json), body.lignes || [], 'invoiced_qty')
    const numbers = toJson(doc.numbers_json || {})
    if (!numbers.facture) numbers.facture = await nextNumber('FF')
    await supabase.from('purchases').update({ stage: allDone(lines, 'invoiced_qty') ? 'facture' : doc.stage, numbers_json: numbers, lines_json: lines }).eq('id', id).then(okOrThrow)
    return { ok: true, partial: true, numbers }
  }

  // Utilisateurs / rôles
  if (path === '/roles' && method === 'GET') {
    const { data, error } = await supabase.from('roles').select('*').order('id')
    if (error) throw new Error(error.message)
    return data
  }
  if (path === '/users' && method === 'GET') {
    const { data, error } = await supabase.from('users').select('id, username, full_name, active, roles(name)').order('id')
    if (error) throw new Error(error.message)
    return data.map(u => ({ id: u.id, username: u.username, full_name: u.full_name, active: u.active, role: u.roles?.name }))
  }
  if (path === '/users' && method === 'POST') {
    const { data, error } = await supabase.from('users').insert({
      username: body.username, password_hash: body.password || 'changeme', full_name: body.full_name || '', role_id: body.role_id, active: true
    }).select('id').single()
    if (error) throw new Error(error.message)
    return { id: data.id, ok: true }
  }
  if (path.startsWith('/users/') && method === 'PUT') {
    const id = path.split('/')[2]
    const payload = { username: body.username, full_name: body.full_name, role_id: body.role_id, active: body.active }
    if (body.password) payload.password_hash = body.password
    const { error } = await supabase.from('users').update(payload).eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }
  if (path.startsWith('/users/') && method === 'DELETE') {
    const id = path.split('/')[2]
    const { error } = await supabase.from('users').update({ active: false }).eq('id', id)
    if (error) throw new Error(error.message)
    return { ok: true }
  }

  throw new Error('Fonction Supabase non encore migrée : ' + method + ' ' + path)
}
