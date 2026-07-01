
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || 'REMPLACER_PAR_VOTRE_SUPABASE_URL';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || 'REMPLACER_PAR_VOTRE_SUPABASE_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const fmt = n => (Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dh = n => `${fmt(n)} DH`;
const today = () => new Date().toISOString().slice(0, 10);

const ALL_PERMS = [
  'dashboard.read',
  'products.read','products.write','products.delete',
  'clients.read','clients.write','clients.delete',
  'suppliers.read','suppliers.write','suppliers.delete',
  'sales.read','sales.write','sales.delete',
  'purchases.read','purchases.write','purchases.delete',
  'users.read','users.write'
];

function can(session, code) {
  return session?.perms?.includes(code);
}

function mapProduct(p) {
  return {
    id: p.id,
    ref: p.ref || '',
    nom: p.name || '',
    categorie: p.category || '',
    unite: p.unit || 'Pièce',
    prixAchat: Number(p.purchase_price || 0),
    prixVente: Number(p.sale_price || 0),
    quantite: Number(p.quantity || 0),
    stockMin: Number(p.min_stock || 0),
    fournisseurId: p.supplier_id
  };
}

function computeTotals(lines, vat = 20, priceIsTTC = true) {
  const base = lines.reduce((s, l) => s + Number(l.prixUnit || 0) * Number(l.qte || 0), 0);
  if (priceIsTTC) {
    const totalTTC = base;
    const totalHT = totalTTC / (1 + vat / 100);
    return { totalHT, vat: totalTTC - totalHT, totalTTC };
  }
  const totalHT = base;
  return { totalHT, vat: totalHT * vat / 100, totalTTC: totalHT * (1 + vat / 100) };
}

async function nextNumber(prefix) {
  const { data } = await supabase.from('counters').select('value').eq('name', prefix).maybeSingle();
  const n = data?.value || 1;
  await supabase.from('counters').upsert({ name: prefix, value: n + 1 }, { onConflict: 'name' });
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`;
}

async function updateStock(lines, sign, source) {
  for (const l of lines) {
    const { data: p, error } = await supabase.from('products').select('quantity').eq('id', l.produitId).single();
    if (error) throw new Error(error.message);
    const newQty = Number(p.quantity || 0) + Number(l.qte || 0) * sign;
    await supabase.from('products').update({ quantity: newQty }).eq('id', l.produitId);
    await supabase.from('stock_movements').insert({
      product_id: l.produitId,
      quantity: Number(l.qte || 0) * sign,
      reason: source,
      created_at: new Date().toISOString()
    });
  }
}

export default function App() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('droguerie_session').then(v => {
      if (v) setSession(JSON.parse(v));
      setLoading(false);
    });
  }, []);

  async function login(username, password) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, password_hash, active, roles(name)')
      .eq('username', username)
      .eq('active', true)
      .single();

    if (error || !data) throw new Error('Identifiant incorrect');
    if (password !== data.password_hash) throw new Error('Mot de passe incorrect');

    const s = {
      user: { id: data.id, username: data.username, full_name: data.full_name, role: data.roles?.name || 'Administrateur' },
      perms: ALL_PERMS
    };
    await AsyncStorage.setItem('droguerie_session', JSON.stringify(s));
    setSession(s);
  }

  async function logout() {
    await AsyncStorage.removeItem('droguerie_session');
    setSession(null);
  }

  if (loading) return <Center text="Chargement..." />;
  if (!session) return <Login onLogin={login} />;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Droguerie<Text style={{ color: '#f59e0b' }}>Pro</Text></Text>
          <Text style={styles.sub}>{session.user.full_name} · {session.user.role}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.iconBtn}><Ionicons name="log-out-outline" size={22} color="#fff" /></TouchableOpacity>
      </View>

      <View style={styles.content}>
        {page === 'dashboard' && <Dashboard session={session} />}
        {page === 'products' && <Products session={session} />}
        {page === 'sales' && <Docs session={session} type="sales" />}
        {page === 'purchases' && <Docs session={session} type="purchases" />}
        {page === 'clients' && <Parties session={session} type="clients" />}
        {page === 'suppliers' && <Parties session={session} type="suppliers" />}
      </View>

      <Nav page={page} setPage={setPage} />
    </SafeAreaView>
  );
}

function Center({ text }) {
  return <SafeAreaView style={styles.center}><Text>{text}</Text></SafeAreaView>;
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');

  async function submit() {
    setErr('');
    try { await onLogin(username, password); }
    catch (e) { setErr(e.message); }
  }

  return (
    <SafeAreaView style={styles.loginRoot}>
      <View style={styles.loginBox}>
        <Text style={styles.loginTitle}>DrogueriePro</Text>
        <Text style={styles.loginSub}>Connexion mobile</Text>
        {err ? <Text style={styles.error}>{err}</Text> : null}
        <TextInput style={styles.input} placeholder="Utilisateur" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity onPress={submit} style={styles.primary}><Text style={styles.primaryText}>Se connecter</Text></TouchableOpacity>
        <Text style={styles.note}>Compte initial : admin / admin123</Text>
      </View>
    </SafeAreaView>
  );
}

function Nav({ page, setPage }) {
  const items = [
    ['dashboard', 'Accueil', 'grid-outline'],
    ['products', 'Stock', 'cube-outline'],
    ['sales', 'Ventes', 'receipt-outline'],
    ['purchases', 'Achats', 'cart-outline'],
    ['clients', 'Clients', 'people-outline'],
    ['suppliers', 'Fourn.', 'business-outline'],
  ];
  return (
    <View style={styles.nav}>
      {items.map(([id, label, icon]) => (
        <TouchableOpacity key={id} onPress={() => setPage(id)} style={styles.navItem}>
          <Ionicons name={icon} size={20} color={page === id ? '#f59e0b' : '#94a3b8'} />
          <Text style={[styles.navText, page === id && styles.navTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Dashboard({ session }) {
  const [d, setD] = useState(null);

  async function load() {
    const { data: products } = await supabase.from('products').select('*');
    const { data: sales } = await supabase.from('sales').select('*').eq('stage', 'facture');
    const { data: purchases } = await supabase.from('purchases').select('*').eq('stage', 'facture');
    setD({
      products: products?.length || 0,
      lowStock: products?.filter(p => Number(p.quantity) <= Number(p.min_stock)).length || 0,
      stockValue: products?.reduce((s, p) => s + Number(p.quantity || 0) * Number(p.purchase_price || 0), 0) || 0,
      ca: sales?.reduce((s, x) => s + Number(x.total_ttc || 0), 0) || 0,
      dettes: purchases?.reduce((s, x) => s + Number(x.total_ttc || 0), 0) || 0
    });
  }

  useEffect(() => { load(); }, []);
  if (!d) return <Center text="Chargement..." />;

  return (
    <ScrollView>
      <Title text="Tableau de bord" />
      <View style={styles.grid2}>
        <Card label="CA facturé" value={dh(d.ca)} />
        <Card label="Valeur stock" value={dh(d.stockValue)} />
        <Card label="Produits" value={d.products} />
        <Card label="Alertes stock" value={d.lowStock} danger={d.lowStock > 0} />
      </View>
    </ScrollView>
  );
}

function Products({ session }) {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);

  async function load() {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) return Alert.alert('Erreur', error.message);
    setRows(data.map(mapProduct));
  }

  useEffect(() => { load(); }, []);

  async function saveProduct(p) {
    const payload = {
      ref: p.ref,
      name: p.nom,
      category: p.categorie || 'Divers',
      unit: p.unite || 'Pièce',
      purchase_price: Number(p.prixAchat || 0),
      sale_price: Number(p.prixVente || 0),
      quantity: Number(p.quantite || 0),
      min_stock: Number(p.stockMin || 0),
      supplier_id: p.fournisseurId || null
    };
    const q = p.id ? supabase.from('products').update(payload).eq('id', p.id) : supabase.from('products').insert(payload);
    const { error } = await q;
    if (error) return Alert.alert('Erreur', error.message);
    setModal(null); load();
  }

  async function adjustStock(p, qty) {
    if (!qty) return;
    const newQty = Number(p.quantite) + Number(qty);
    const { error } = await supabase.from('products').update({ quantity: newQty }).eq('id', p.id);
    if (error) return Alert.alert('Erreur', error.message);
    await supabase.from('stock_movements').insert({ product_id: p.id, quantity: Number(qty), reason: 'Ajustement mobile', created_at: new Date().toISOString() });
    load();
  }

  return (
    <View style={{ flex: 1 }}>
      <Title text="Produits & Stock" />
      <Toolbar>
        {can(session, 'products.write') && <Btn text="Nouveau" icon="add" onPress={() => setModal({ mode: 'product', item: {} })} />}
      </Toolbar>
      <FlatList
        data={rows}
        keyExtractor={x => String(x.id)}
        renderItem={({ item }) => (
          <RowCard
            title={item.nom}
            subtitle={`${item.ref} · ${item.categorie}`}
            value={`${item.quantite} ${item.unite}`}
            danger={item.quantite <= item.stockMin}
            actions={[
              ['Modifier', 'create-outline', () => setModal({ mode: 'product', item })],
              ['Stock +', 'add-circle-outline', () => setModal({ mode: 'stock', item })]
            ]}
          />
        )}
      />
      {modal?.mode === 'product' && <ProductModal item={modal.item} onClose={() => setModal(null)} onSave={saveProduct} />}
      {modal?.mode === 'stock' && <StockModal item={modal.item} onClose={() => setModal(null)} onSave={(qty) => { adjustStock(modal.item, qty); setModal(null); }} />}
    </View>
  );
}

function Parties({ session, type }) {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const isClient = type === 'clients';

  async function load() {
    const { data, error } = await supabase.from(type).select('*').order('name');
    if (error) return Alert.alert('Erreur', error.message);
    setRows(data || []);
  }
  useEffect(() => { load(); }, [type]);

  async function save(x) {
    const payload = {
      name: x.name || x.nom || '',
      ice: x.ice || '',
      phone: x.phone || x.tel || '',
      city: x.city || x.ville || '',
      address: x.address || x.adresse || '',
      ...(isClient ? { type: x.type || 'entreprise' } : { contact: x.contact || '' })
    };
    const q = x.id ? supabase.from(type).update(payload).eq('id', x.id) : supabase.from(type).insert(payload);
    const { error } = await q;
    if (error) return Alert.alert('Erreur', error.message);
    setModal(null); load();
  }

  return (
    <View style={{ flex: 1 }}>
      <Title text={isClient ? 'Clients' : 'Fournisseurs'} />
      <Toolbar>
        <Btn text="Nouveau" icon="add" onPress={() => setModal({})} />
      </Toolbar>
      <FlatList
        data={rows}
        keyExtractor={x => String(x.id)}
        renderItem={({ item }) => (
          <RowCard
            title={item.name}
            subtitle={`ICE: ${item.ice || '-'} · ${item.city || ''}`}
            value={item.phone || ''}
            actions={[['Modifier', 'create-outline', () => setModal(item)]]}
          />
        )}
      />
      {modal && <PartyModal item={modal} isClient={isClient} onClose={() => setModal(null)} onSave={save} />}
    </View>
  );
}

function Docs({ session, type }) {
  const isSales = type === 'sales';
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [parties, setParties] = useState([]);
  const [modal, setModal] = useState(null);

  async function load() {
    const [{ data: docs }, { data: prod }, { data: party }] = await Promise.all([
      supabase.from(type).select('*').order('id', { ascending: false }),
      supabase.from('products').select('*').order('name'),
      supabase.from(isSales ? 'clients' : 'suppliers').select('*').order('name')
    ]);
    setRows((docs || []).map(d => ({ ...d, numeros: d.numbers_json || {}, lignes: d.lines_json || [], paiements: d.payments_json || [] })));
    setProducts((prod || []).map(mapProduct));
    setParties(party || []);
  }
  useEffect(() => { load(); }, [type]);

  async function createDoc(form) {
    const prod = products.find(p => p.id === form.productId);
    const party = parties.find(p => p.id === form.partyId);
    if (!prod || !party) return Alert.alert('Erreur', 'Produit ou tiers manquant');

    const line = { produitId: prod.id, ref: prod.ref, nom: prod.nom, prixUnit: isSales ? prod.prixVente : prod.prixAchat, qte: Number(form.qte || 1) };
    const vat = 20;
    const totals = computeTotals([line], vat, isSales);
    const start = form.start;
    const prefix = isSales ? (start === 'facture' ? 'FAC' : 'DEV') : (start === 'reception' ? 'BR' : 'CF');
    const key = isSales ? (start === 'facture' ? 'facture' : 'devis') : (start === 'reception' ? 'reception' : 'commande');
    const numbers = { [key]: await nextNumber(prefix) };

    if (isSales && start === 'facture') await updateStock([line], -1, 'Vente directe mobile');
    if (!isSales && start === 'reception') await updateStock([line], 1, 'Réception directe mobile');

    const payload = isSales ? {
      date: form.date,
      client_id: party.id,
      client_name: party.name,
      stage: start,
      numbers_json: numbers,
      lines_json: [line],
      vat_rate: vat,
      total_ht: totals.totalHT,
      vat: totals.vat,
      total_ttc: totals.totalTTC,
      delivered: start === 'facture',
      created_by: session.user.id
    } : {
      date: form.date,
      supplier_id: party.id,
      supplier_name: party.name,
      stage: start,
      numbers_json: numbers,
      lines_json: [line],
      vat_rate: vat,
      total_ht: totals.totalHT,
      vat: totals.vat,
      total_ttc: totals.totalTTC,
      received: start === 'reception',
      created_by: session.user.id
    };

    const { error } = await supabase.from(type).insert(payload);
    if (error) return Alert.alert('Erreur', error.message);
    setModal(null); load();
  }

  async function advance(doc) {
    const stages = isSales ? ['devis', 'commande', 'livraison', 'facture'] : ['commande', 'reception', 'facture'];
    const next = stages[stages.indexOf(doc.stage) + 1];
    if (!next) return;

    const prefixes = isSales ? { commande: 'BC', livraison: 'BL', facture: 'FAC' } : { reception: 'BR', facture: 'FF' };
    const keys = isSales ? { commande: 'commande', livraison: 'bl', facture: 'facture' } : { reception: 'reception', facture: 'facture' };
    const nums = { ...(doc.numeros || {}), [keys[next]]: await nextNumber(prefixes[next]) };

    if (isSales && next === 'livraison' && !doc.delivered) await updateStock(doc.lignes, -1, 'Livraison mobile');
    if (!isSales && next === 'reception' && !doc.received) await updateStock(doc.lignes, 1, 'Réception mobile');

    const payload = isSales
      ? { stage: next, numbers_json: nums, delivered: next === 'livraison' ? true : doc.delivered }
      : { stage: next, numbers_json: nums, received: next === 'reception' ? true : doc.received };

    const { error } = await supabase.from(type).update(payload).eq('id', doc.id);
    if (error) return Alert.alert('Erreur', error.message);
    load();
  }

  async function partial(doc, mode) {
    const qteText = await promptNumber('Quantité partielle');
    const qte = Number(qteText || 0);
    if (!qte) return;
    const original = doc.lignes?.[0];
    if (!original) return;
    const line = { ...original, qte };
    const totals = computeTotals([line], doc.vat_rate || 20, isSales);
    const prefix = mode === 'delivery' ? 'BL' : mode === 'reception' ? 'BR' : isSales ? 'FAC' : 'FF';
    const key = mode === 'delivery' ? 'bl' : mode === 'reception' ? 'reception' : 'facture';
    const numbers = { ...(doc.numeros || {}), [key]: await nextNumber(prefix) };

    if (mode === 'delivery') await updateStock([line], -1, 'Livraison partielle mobile');
    if (mode === 'reception') await updateStock([line], 1, 'Réception partielle mobile');

    const payload = {
      date: today(),
      stage: mode === 'delivery' ? 'livraison' : mode === 'reception' ? 'reception' : 'facture',
      numbers_json: numbers,
      lines_json: [line],
      vat_rate: doc.vat_rate || 20,
      total_ht: totals.totalHT,
      vat: totals.vat,
      total_ttc: totals.totalTTC,
      payments_json: [],
      ...(isSales ? { client_id: doc.client_id, client_name: doc.client_name, delivered: mode === 'delivery', created_by: session.user.id }
                 : { supplier_id: doc.supplier_id, supplier_name: doc.supplier_name, received: mode === 'reception', created_by: session.user.id })
    };

    const { error } = await supabase.from(type).insert(payload);
    if (error) return Alert.alert('Erreur', error.message);
    load();
  }

  async function pay(doc) {
    const montantText = await promptNumber('Montant réglé');
    const montant = Number(montantText || 0);
    if (!montant) return;
    const payments = [...(doc.paiements || []), { date: today(), mode: 'Espèces', montant }];
    const { error } = await supabase.from(type).update({ payments_json: payments }).eq('id', doc.id);
    if (error) return Alert.alert('Erreur', error.message);
    load();
  }

  return (
    <View style={{ flex: 1 }}>
      <Title text={isSales ? 'Ventes' : 'Achats'} />
      <Toolbar>
        <Btn text={isSales ? 'Devis' : 'Commande'} icon="add" onPress={() => setModal({ start: isSales ? 'devis' : 'commande' })} />
        <Btn text="Direct" icon="flash" onPress={() => setModal({ start: isSales ? 'facture' : 'reception' })} />
      </Toolbar>
      <FlatList
        data={rows}
        keyExtractor={x => String(x.id)}
        renderItem={({ item }) => (
          <RowCard
            title={Object.values(item.numeros || {})[0] || `#${item.id}`}
            subtitle={`${item.date} · ${isSales ? item.client_name : item.supplier_name}`}
            value={`${item.stage} · ${dh(item.total_ttc)}`}
            actions={[
              ['Avancer', 'arrow-forward-circle-outline', () => advance(item)],
              ['Payer', 'cash-outline', () => pay(item)],
              [isSales ? 'Liv. partielle' : 'Récep. partielle', 'git-branch-outline', () => partial(item, isSales ? 'delivery' : 'reception')],
              ['Fact. partielle', 'document-text-outline', () => partial(item, 'invoice')]
            ]}
          />
        )}
      />
      {modal && <DocModal isSales={isSales} products={products} parties={parties} form={modal} onClose={() => setModal(null)} onSave={createDoc} />}
    </View>
  );
}

function promptNumber(title) {
  return new Promise(resolve => {
    Alert.prompt ? Alert.prompt(title, '', [{ text: 'Annuler', style: 'cancel', onPress: () => resolve(null) }, { text: 'OK', onPress: resolve }], 'plain-text', '') :
    resolve(String(1));
  });
}

function Title({ text }) { return <Text style={styles.title}>{text}</Text>; }
function Toolbar({ children }) { return <View style={styles.toolbar}>{children}</View>; }
function Btn({ text, icon, onPress }) {
  return <TouchableOpacity onPress={onPress} style={styles.btn}><Ionicons name={icon} size={16} color="#0f172a" /><Text style={styles.btnText}>{text}</Text></TouchableOpacity>;
}
function Card({ label, value, danger }) {
  return <View style={styles.card}><Text style={styles.cardLabel}>{label}</Text><Text style={[styles.cardValue, danger && { color: '#dc2626' }]}>{value}</Text></View>;
}
function RowCard({ title, subtitle, value, danger, actions=[] }) {
  return (
    <View style={styles.rowCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSub}>{subtitle}</Text>
        </View>
        <Text style={[styles.rowValue, danger && { color: '#dc2626' }]}>{value}</Text>
      </View>
      <View style={styles.actions}>
        {actions.map(([label, icon, fn]) => <TouchableOpacity key={label} onPress={fn} style={styles.action}><Ionicons name={icon} size={15} color="#334155" /><Text style={styles.actionText}>{label}</Text></TouchableOpacity>)}
      </View>
    </View>
  );
}

function ProductModal({ item, onClose, onSave }) {
  const [f, setF] = useState({ ref: '', nom: '', categorie: 'Divers', unite: 'Pièce', prixAchat: 0, prixVente: 0, quantite: 0, stockMin: 0, ...item });
  return <FormModal title="Produit" onClose={onClose} onSave={() => onSave(f)}>
    <Input label="Réf" value={f.ref} onChangeText={v => setF({ ...f, ref: v })} />
    <Input label="Nom" value={f.nom} onChangeText={v => setF({ ...f, nom: v })} />
    <Input label="Catégorie" value={f.categorie} onChangeText={v => setF({ ...f, categorie: v })} />
    <Input label="Unité" value={f.unite} onChangeText={v => setF({ ...f, unite: v })} />
    <Input label="Prix achat" value={String(f.prixAchat)} keyboardType="numeric" onChangeText={v => setF({ ...f, prixAchat: v })} />
    <Input label="Prix vente" value={String(f.prixVente)} keyboardType="numeric" onChangeText={v => setF({ ...f, prixVente: v })} />
    <Input label="Quantité" value={String(f.quantite)} keyboardType="numeric" onChangeText={v => setF({ ...f, quantite: v })} />
    <Input label="Seuil alerte" value={String(f.stockMin)} keyboardType="numeric" onChangeText={v => setF({ ...f, stockMin: v })} />
  </FormModal>;
}

function StockModal({ item, onClose, onSave }) {
  const [qty, setQty] = useState('1');
  return <FormModal title={`Ajuster stock · ${item.nom}`} onClose={onClose} onSave={() => onSave(qty)}>
    <Input label="Quantité à ajouter ou retirer" value={qty} keyboardType="numeric" onChangeText={setQty} />
  </FormModal>;
}

function PartyModal({ item, isClient, onClose, onSave }) {
  const [f, setF] = useState({ name: '', ice: '', phone: '', city: '', address: '', type: 'entreprise', contact: '', ...item });
  return <FormModal title={isClient ? 'Client' : 'Fournisseur'} onClose={onClose} onSave={() => onSave(f)}>
    <Input label="Nom" value={f.name || ''} onChangeText={v => setF({ ...f, name: v })} />
    <Input label="ICE" value={f.ice || ''} onChangeText={v => setF({ ...f, ice: v })} />
    <Input label="Téléphone" value={f.phone || ''} onChangeText={v => setF({ ...f, phone: v })} />
    <Input label="Ville" value={f.city || ''} onChangeText={v => setF({ ...f, city: v })} />
    <Input label="Adresse" value={f.address || ''} onChangeText={v => setF({ ...f, address: v })} />
    {!isClient && <Input label="Contact" value={f.contact || ''} onChangeText={v => setF({ ...f, contact: v })} />}
  </FormModal>;
}

function DocModal({ isSales, products, parties, form, onClose, onSave }) {
  const [f, setF] = useState({ date: today(), partyId: parties[0]?.id, productId: products[0]?.id, qte: '1', ...form });
  return <FormModal title={isSales ? 'Nouvelle vente' : 'Nouvel achat'} onClose={onClose} onSave={() => onSave(f)}>
    <Text style={styles.label}>Date</Text>
    <TextInput style={styles.input} value={f.date} onChangeText={v => setF({ ...f, date: v })} />
    <Text style={styles.label}>{isSales ? 'Client ID' : 'Fournisseur ID'}</Text>
    <TextInput style={styles.input} value={String(f.partyId || '')} onChangeText={v => setF({ ...f, partyId: Number(v) })} />
    <Text style={styles.helper}>{parties.map(p => `${p.id}: ${p.name}`).join(' | ')}</Text>
    <Text style={styles.label}>Produit ID</Text>
    <TextInput style={styles.input} value={String(f.productId || '')} onChangeText={v => setF({ ...f, productId: Number(v) })} />
    <Text style={styles.helper}>{products.slice(0, 6).map(p => `${p.id}: ${p.nom}`).join(' | ')}</Text>
    <Input label="Quantité" value={String(f.qte)} keyboardType="numeric" onChangeText={v => setF({ ...f, qte: v })} />
  </FormModal>;
}

function FormModal({ title, children, onClose, onSave }) {
  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <ScrollView>
            <Text style={styles.modalTitle}>{title}</Text>
            {children}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.cancel}><Text>Annuler</Text></TouchableOpacity>
              <TouchableOpacity onPress={onSave} style={styles.primarySmall}><Text style={styles.primaryText}>Enregistrer</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Input({ label, ...props }) {
  return <>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} {...props} />
  </>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loginRoot: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 20 },
  loginBox: { backgroundColor: '#fff', borderRadius: 18, padding: 22 },
  loginTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  loginSub: { color: '#64748b', marginBottom: 16 },
  error: { color: '#dc2626', backgroundColor: '#fee2e2', padding: 8, borderRadius: 8, marginBottom: 10 },
  note: { color: '#94a3b8', fontSize: 11, marginTop: 10 },
  header: { backgroundColor: '#0f172a', paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: '#fff', fontWeight: '900', fontSize: 22 },
  sub: { color: '#94a3b8', fontSize: 12 },
  iconBtn: { backgroundColor: '#1e293b', padding: 8, borderRadius: 10 },
  content: { flex: 1, padding: 14 },
  nav: { flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 8, justifyContent: 'space-around' },
  navItem: { alignItems: 'center', gap: 2 },
  navText: { color: '#94a3b8', fontSize: 10 },
  navTextActive: { color: '#f59e0b', fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, width: '48%', borderWidth: 1, borderColor: '#e2e8f0' },
  cardLabel: { color: '#64748b', fontSize: 12 },
  cardValue: { color: '#0f172a', fontWeight: '900', fontSize: 18, marginTop: 6 },
  toolbar: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  btn: { backgroundColor: '#f59e0b', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', gap: 6, alignItems: 'center' },
  btnText: { color: '#0f172a', fontWeight: '800' },
  rowCard: { backgroundColor: '#fff', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  rowTitle: { color: '#0f172a', fontWeight: '900', fontSize: 15 },
  rowSub: { color: '#64748b', marginTop: 2 },
  rowValue: { color: '#0f172a', fontWeight: '800', textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  action: { backgroundColor: '#f1f5f9', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10, flexDirection: 'row', gap: 4, alignItems: 'center' },
  actionText: { fontSize: 11, color: '#334155', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', maxHeight: '88%', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18 },
  modalTitle: { fontWeight: '900', fontSize: 20, marginBottom: 12, color: '#0f172a' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 10, marginBottom: 10, backgroundColor: '#fff' },
  label: { color: '#475569', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  helper: { color: '#94a3b8', fontSize: 11, marginBottom: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancel: { padding: 12 },
  primary: { backgroundColor: '#f59e0b', padding: 13, borderRadius: 12, alignItems: 'center' },
  primarySmall: { backgroundColor: '#f59e0b', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  primaryText: { color: '#0f172a', fontWeight: '900' }
});
