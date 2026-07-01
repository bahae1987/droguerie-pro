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

export async function api(path, options = {}) {
  const method = options.method || 'GET'
  const body = options.body ? JSON.parse(options.body) : null

  // LOGIN
  if (path === '/auth/login' && method === 'POST') {
    const { username, password } = body

    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, password_hash, active, roles(name)')
      .eq('username', username)
      .eq('active', true)
      .single()

    if (error || !data) throw new Error('Identifiant incorrect')

    // TEMPORAIRE : mot de passe simple
    if (password !== 'admin123') throw new Error('Mot de passe incorrect')

    const session = {
      token: 'supabase-local',
      user: {
        id: data.id,
        username: data.username,
        full_name: data.full_name,
        role: data.roles?.name || 'Administrateur'
      },
      perms: [
        'dashboard.read',
        'products.read','products.write','products.delete',
        'clients.read','clients.write',
        'suppliers.read','suppliers.write',
        'sales.read','sales.write',
        'purchases.read','purchases.write',
        'users.read','users.write'
      ]
    }

    return session
  }

  if (path === '/dashboard') {
    const { data: products } = await supabase.from('products').select('*')
    const { data: sales } = await supabase.from('sales').select('*').eq('stage', 'facture')

    return {
      products: products?.length || 0,
      lowStock: products?.filter(p => p.quantity <= p.min_stock).length || 0,
      stockValue: products?.reduce((s, p) => s + Number(p.quantity || 0) * Number(p.purchase_price || 0), 0) || 0,
      ca: sales?.reduce((s, x) => s + Number(x.total_ttc || 0), 0) || 0
    }
  }

  if (path === '/products') {
    const { data, error } = await supabase.from('products').select('*').order('name')
    if (error) throw new Error(error.message)

    return data.map(p => ({
      id: p.id,
      ref: p.ref,
      nom: p.name,
      categorie: p.category,
      unite: p.unit,
      prixAchat: p.purchase_price,
      prixVente: p.sale_price,
      quantite: p.quantity,
      stockMin: p.min_stock,
      fournisseurId: p.supplier_id
    }))
  }

  if (path === '/clients') {
    const { data, error } = await supabase.from('clients').select('*').order('name')
    if (error) throw new Error(error.message)
    return data
  }

  if (path === '/suppliers') {
    const { data, error } = await supabase.from('suppliers').select('*').order('name')
    if (error) throw new Error(error.message)
    return data
  }

  if (path === '/sales') {
    const { data, error } = await supabase.from('sales').select('*').order('id', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(x => ({
      ...x,
      numeros: x.numbers_json || {},
      lignes: x.lines_json || [],
      paiements: x.payments_json || []
    }))
  }

  if (path === '/purchases') {
    const { data, error } = await supabase.from('purchases').select('*').order('id', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(x => ({
      ...x,
      numeros: x.numbers_json || {},
      lignes: x.lines_json || [],
      paiements: x.payments_json || []
    }))
  }

  if (path === '/users') {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, active, roles(name)')
      .order('id')

    if (error) throw new Error(error.message)

    return data.map(u => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      active: u.active,
      role: u.roles?.name
    }))
  }

  if (path === '/roles') {
    const { data, error } = await supabase.from('roles').select('*').order('id')
    if (error) throw new Error(error.message)
    return data
  }

  throw new Error('Fonction Supabase non encore migrée : ' + path)
}

export const fmt = n =>
  (Number(n) || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

export const dh = n => fmt(n) + ' DH'
