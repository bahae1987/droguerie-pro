/* =====================================================================
 *  DrogueriePro — Migration d'une ancienne sauvegarde (V46) vers v3
 *  Lit un dump SQL PostgreSQL (roles/users/products/clients/suppliers/
 *  sales/purchases/...) et reconstruit les données dans le schéma v3,
 *  en éclatant les ventes/achats monolithiques en commande → livraison
 *  → facture → encaissements, avec reconstitution du PARTIEL.
 *
 *  Usage :  node migrate-from-backup.js <backup.sql> [droguerie.db]
 *  Dépendances : sql.js (pur JS, aucune compilation) + bcryptjs
 *    npm i sql.js bcryptjs
 * ===================================================================== */
import initSqlJs from "sql.js";
import bcrypt from "bcryptjs";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP = process.argv[2] || "backup.sql";
const OUT_DB = process.argv[3] || "droguerie.db";
const OUT_SQL = OUT_DB.replace(/\.db$/, "") + "-data.sql";

const SQL = await initSqlJs();
const uidSeq = (() => { let n = 0; return (p) => `${p}-${++n}`; })();

/* ---------- 1) Charger l'ancienne base en mémoire ---------- */
const old = new SQL.Database();
old.run(`
CREATE TABLE roles(id,name,description);
CREATE TABLE permissions(id,code,label,module);
CREATE TABLE role_permissions(role_id,permission_id);
CREATE TABLE branches(id,name,city,active,created_at,address,phone,manager_name);
CREATE TABLE users(id,username,password_hash,full_name,role_id,active,created_at,branch_id);
CREATE TABLE products(id,ref,name,category,unit,purchase_price,sale_price,quantity,min_stock,supplier_id,branch_id,name_ar);
CREATE TABLE stock_movements(id,product_id,quantity,reason,created_at,user_id,user_label,doc_type,doc_number,branch_id);
CREATE TABLE clients(id,name,type,ice,phone,city,address,branch_id,created_by,created_by_label,assigned_to);
CREATE TABLE suppliers(id,name,ice,phone,city,contact,address,branch_id,created_by,created_by_label,assigned_to);
CREATE TABLE sales(id,date,client_id,client_name,stage,numbers_json,lines_json,vat_rate,total_ht,vat,total_ttc,delivered,payments_json,created_by,created_at,base_doc_id,branch_id,qty_done,doc_status,processed_lines_json);
CREATE TABLE purchases(id,date,supplier_id,supplier_name,stage,numbers_json,lines_json,vat_rate,total_ht,vat,total_ttc,received,payments_json,created_by,created_at,base_doc_id,branch_id,qty_done,doc_status,processed_lines_json);
CREATE TABLE app_settings(key,value);
CREATE TABLE saas_modules(code,name,description,enabled,monthly_price,yearly_price,sort_order,created_at);
CREATE TABLE audit_logs(id,module,action,object_label,detail,user_id,user_label,created_at,branch_id);
`);
let raw = readFileSync(BACKUP, "utf8").replace(/::[a-zA-Z]+/g, "").replace(/ON CONFLICT DO NOTHING/g, "");
old.run(raw); // SQLite comprend true/false et garde les JSON comme texte
const q = (sql, ...a) => { const s = old.prepare(sql); s.bind(a); const o = []; while (s.step()) o.push(s.getAsObject()); s.free(); return o; };
const J = (s) => { try { return JSON.parse(s); } catch { return null; } };

/* ---------- 2) Créer la base v3 ---------- */
const v3 = new SQL.Database();
v3.run(readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
// On garde les 4 rôles système seedés, mais on remplace users + settings seedés
v3.run("DELETE FROM users; DELETE FROM settings;");
const ins = (sql, ...a) => v3.run(sql, a);

/* ---------- 3) Paramètres société (depuis app_settings) ---------- */
const settings = {}; q("SELECT key,value FROM app_settings").forEach((r) => (settings[r.key] = r.value));
ins(`INSERT INTO settings (id,nom_entreprise,ice,rc,adresse,ville,tel,tva,lang,
       c_devis,c_commande,c_bl,c_facture,c_cf,c_br,c_ff,c_dep,c_chg)
     VALUES (1,?,?,?,?,?,?,?,?, 12,8,11,16,2,2,2,1,1)`,
  settings.company_name || "DrogueriePro", settings.company_ice || "", settings.company_rc || "",
  settings.company_address || "", "", settings.company_phone || "", Number(settings.vat_rate || 20), "fr");

/* ---------- 4) Utilisateurs (rôles mappés, mots de passe hachés) ---------- */
const ROLE_MAP = { "Administrateur": "role-admin", "Gérant": "role-gerant", "Vendeur": "role-vendeur", "Magasinier": "role-magasinier", "SuperAdmin": "role-admin" };
const oldRoleName = {}; q("SELECT id,name FROM roles").forEach((r) => (oldRoleName[r.id] = r.name));
for (const u of q("SELECT * FROM users")) {
  const roleId = ROLE_MAP[oldRoleName[u.role_id]] || "role-vendeur";
  const hash = bcrypt.hashSync(String(u.password_hash || "changeme"), 10); // ancien mdp en clair -> bcrypt
  ins("INSERT INTO users (id,nom,login,email,password_hash,role_id,actif,created_at) VALUES (?,?,?,?,?,?,?,?)",
    "u" + u.id, u.full_name || u.username, u.username, null, hash, roleId, Number(u.active) ? 1 : 0, u.created_at);
}

/* ---------- 5) Fournisseurs & clients ---------- */
for (const s of q("SELECT * FROM suppliers"))
  ins("INSERT INTO suppliers (id,nom,ice,tel,ville,contact,created_at) VALUES (?,?,?,?,?,?,?)", "s" + s.id, s.name, s.ice, s.phone, s.city, s.contact);
for (const c of q("SELECT * FROM clients"))
  ins("INSERT INTO clients (id,nom,type,ice,tel,ville,adresse,plafond_credit) VALUES (?,?,?,?,?,?,?,0)", "c" + c.id, c.name, c.type, c.ice, c.phone, c.city, c.address);

/* ---------- 6) Produits (+ nom_ar, stock final conservé tel quel) ---------- */
const prodCost = {};
for (const p of q("SELECT * FROM products")) {
  prodCost["p" + p.id] = Number(p.purchase_price) || 0;
  ins(`INSERT INTO products (id,ref,nom,categorie,fournisseur_id,prix_achat,prix_vente,quantite,stock_min,unite,nom_ar)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    "p" + p.id, p.ref, p.name, p.category, p.supplier_id ? "s" + p.supplier_id : null,
    Number(p.purchase_price) || 0, Number(p.sale_price) || 0, Number(p.quantity) || 0, Number(p.min_stock) || 0, p.unit, p.name_ar);
}

/* ---------- 7) Historique des mouvements de stock (traçabilité) ---------- */
for (const m of q("SELECT * FROM stock_movements")) {
  const qte = Number(m.quantity) || 0;
  ins("INSERT INTO stock_movements (id,produit_id,type,qte,motif,date) VALUES (?,?,?,?,?,?)",
    "m" + m.id, "p" + m.product_id, qte >= 0 ? "entree" : "sortie", Math.abs(qte),
    (m.reason || "") + (m.doc_number ? " · " + m.doc_number : ""), m.created_at);
}

/* ---------- 8) VENTES : éclatement commande → livraison → facture ---------- */
const sales = q("SELECT * FROM sales");
const childrenOf = {}; // parentId -> [childSale]
for (const s of sales) if (s.base_doc_id) (childrenOf[s.base_doc_id] ||= []).push(s);
const orderLineRef = {}; // saleId(parent) -> { produitId -> order_line_id }
const vat = (s) => Number(s.vat_rate) || 20;

function createOrder(s, stage) {
  const oid = "so" + s.id; const nums = J(s.numbers_json) || {};
  ins(`INSERT INTO sales_orders (id,date,client_id,client_nom,num_devis,num_commande,stage,taux_tva,total_ht,tva,total_ttc,statut)
       VALUES (?,?,?,?,?,?,?,?,?,?,?, 'ouvert')`,
    oid, s.date, s.client_id ? "c" + s.client_id : null, s.client_name, nums.devis || null, nums.commande || null,
    stage, vat(s), Number(s.total_ht) || 0, Number(s.vat) || 0, Number(s.total_ttc) || 0);
  orderLineRef[s.id] = {};
  for (const l of (J(s.lines_json) || [])) {
    const lid = uidSeq("sol");
    orderLineRef[s.id][l.produitId] = lid;
    ins("INSERT INTO sales_order_lines (id,order_id,produit_id,ref,nom,prix_unit,qte_commandee,qte_livree,qte_facturee) VALUES (?,?,?,?,?,?,?,0,0)",
      lid, oid, "p" + l.produitId, l.ref, l.nom, Number(l.prixUnit) || 0, Number(l.qte) || 0);
  }
  return oid;
}
function addDelivery(s, parentSaleId, blNum) {
  const did = "dl" + s.id; let ht = 0;
  ins("INSERT INTO deliveries (id,date,client_id,client_nom,num_bl,total_ht) VALUES (?,?,?,?,?,0)",
    did, s.date, s.client_id ? "c" + s.client_id : null, s.client_name, blNum);
  for (const l of (J(s.lines_json) || [])) {
    const olid = orderLineRef[parentSaleId]?.[l.produitId];
    ins("INSERT INTO delivery_lines (id,delivery_id,order_line_id,order_id,produit_id,nom,prix_unit,qte) VALUES (?,?,?,?,?,?,?,?)",
      uidSeq("dll"), did, olid || null, "so" + parentSaleId, "p" + l.produitId, l.nom, Number(l.prixUnit) || 0, Number(l.qte) || 0);
    if (olid) ins("UPDATE sales_order_lines SET qte_livree=qte_livree+? WHERE id=?", Number(l.qte) || 0, olid);
    ht += (Number(l.prixUnit) || 0) * (Number(l.qte) || 0);
  }
  ins("UPDATE deliveries SET total_ht=? WHERE id=?", ht / (1 + vat(s) / 100), did);
}
function addInvoice(s, parentSaleId, facNum) {
  const fid = "ci" + s.id;
  ins(`INSERT INTO customer_invoices (id,date,client_id,client_nom,num_facture,base,taux_tva,total_ht,tva,total_ttc)
       VALUES (?,?,?,?,?, 'livraison',?,?,?,?)`,
    fid, s.date, s.client_id ? "c" + s.client_id : null, s.client_name, facNum, vat(s),
    Number(s.total_ht) || 0, Number(s.vat) || 0, Number(s.total_ttc) || 0);
  for (const l of (J(s.lines_json) || [])) {
    const olid = orderLineRef[parentSaleId]?.[l.produitId];
    ins("INSERT INTO customer_invoice_lines (id,invoice_id,order_line_id,order_id,produit_id,nom,prix_unit,cout_unit,qte) VALUES (?,?,?,?,?,?,?,?,?)",
      uidSeq("cil"), fid, olid || null, "so" + parentSaleId, "p" + l.produitId, l.nom,
      Number(l.prixUnit) || 0, prodCost["p" + l.produitId] || 0, Number(l.qte) || 0);
    if (olid) ins("UPDATE sales_order_lines SET qte_facturee=qte_facturee+? WHERE id=?", Number(l.qte) || 0, olid);
  }
  // encaissements (hors annulés)
  for (const p of (J(s.payments_json) || [])) {
    if (p.canceled) continue;
    ins("INSERT INTO sale_payments (id,invoice_id,date,montant,mode,note) VALUES (?,?,?,?,?,?)",
      uidSeq("sp"), fid, p.date || s.date, Number(p.montant) || 0, p.mode || "Espèces", p.note || null);
  }
}

// Pass A : parents (base_doc_id nul)
for (const s of sales.filter((x) => !x.base_doc_id)) {
  const nums = J(s.numbers_json) || {};
  const hasChildren = !!childrenOf[s.id];
  const isDevisOnly = s.stage === "devis" && !nums.facture && !nums.commande;
  const stage = isDevisOnly ? "devis" : "commande";
  createOrder(s, stage);
  if (!hasChildren && nums.facture) {        // vente directe : livraison + facture sur ses propres lignes
    if (nums.livraison) addDelivery(s, s.id, nums.livraison);
    else for (const l of (J(s.lines_json) || [])) { const olid = orderLineRef[s.id][l.produitId]; if (olid) ins("UPDATE sales_order_lines SET qte_livree=qte_livree+? WHERE id=?", Number(l.qte) || 0, olid); }
    addInvoice(s, s.id, nums.facture);
  } else if (!hasChildren && !nums.facture && Number(s.delivered)) {
    // commande livrée sans facture : marquer livré selon processed_lines_json
    const proc = J(s.processed_lines_json) || {};
    for (const pid in proc) { const olid = orderLineRef[s.id][pid]; if (olid) ins("UPDATE sales_order_lines SET qte_livree=qte_livree+? WHERE id=?", Number(proc[pid]) || 0, olid); }
  }
}
// Pass B : enfants (documents partiels rattachés au parent)
for (const pid in childrenOf) {
  for (const s of childrenOf[pid]) {
    const nums = J(s.numbers_json) || {};
    if (nums.livraison) addDelivery(s, Number(pid), nums.livraison);
    if (nums.facture) addInvoice(s, Number(pid), nums.facture);
  }
}

/* ---------- 9) ACHATS : commande → réception → facture ---------- */
for (const p of q("SELECT * FROM purchases")) {
  const nums = J(p.numbers_json) || {}; const lines = J(p.lines_json) || []; const tva = Number(p.vat_rate) || 20;
  const oid = "po" + p.id; const olRef = {};
  ins(`INSERT INTO purchase_orders (id,date,fournisseur_id,fournisseur_nom,num_commande,taux_tva,total_ht,tva,total_ttc,statut)
       VALUES (?,?,?,?,?,?,?,?,?, 'ouvert')`,
    oid, p.date, p.supplier_id ? "s" + p.supplier_id : null, p.supplier_name,
    nums.commande || ("IMP-" + (nums.reception || p.id)), tva, Number(p.total_ht) || 0, Number(p.vat) || 0, Number(p.total_ttc) || 0);
  for (const l of lines) { const lid = uidSeq("pol"); olRef[l.produitId] = lid;
    ins("INSERT INTO purchase_order_lines (id,order_id,produit_id,ref,nom,prix_unit,qte_commandee,qte_recue,qte_facturee) VALUES (?,?,?,?,?,?,?,0,0)",
      lid, oid, "p" + l.produitId, l.ref, l.nom, Number(l.prixUnit) || 0, Number(l.qte) || 0); }
  if (nums.reception || Number(p.received)) {
    const rid = "rc" + p.id; let ht = 0;
    ins("INSERT INTO receptions (id,date,fournisseur_id,fournisseur_nom,num_reception,total_ht) VALUES (?,?,?,?,?,0)",
      rid, p.date, p.supplier_id ? "s" + p.supplier_id : null, p.supplier_name, nums.reception || ("BR-IMP-" + p.id));
    for (const l of lines) {
      ins("INSERT INTO reception_lines (id,reception_id,order_line_id,order_id,produit_id,nom,prix_unit,qte) VALUES (?,?,?,?,?,?,?,?)",
        uidSeq("rcl"), rid, olRef[l.produitId], oid, "p" + l.produitId, l.nom, Number(l.prixUnit) || 0, Number(l.qte) || 0);
      ins("UPDATE purchase_order_lines SET qte_recue=qte_recue+? WHERE id=?", Number(l.qte) || 0, olRef[l.produitId]);
      ht += (Number(l.prixUnit) || 0) * (Number(l.qte) || 0);
    }
    ins("UPDATE receptions SET total_ht=? WHERE id=?", ht, rid);
  }
  if (nums.facture) {
    const fid = "si" + p.id;
    ins(`INSERT INTO supplier_invoices (id,date,fournisseur_id,fournisseur_nom,num_facture,base,taux_tva,total_ht,tva,total_ttc)
         VALUES (?,?,?,?,?, 'reception',?,?,?,?)`,
      fid, p.date, p.supplier_id ? "s" + p.supplier_id : null, p.supplier_name, nums.facture, tva,
      Number(p.total_ht) || 0, Number(p.vat) || 0, Number(p.total_ttc) || 0);
    for (const l of lines) {
      ins("INSERT INTO supplier_invoice_lines (id,invoice_id,order_line_id,order_id,produit_id,nom,prix_unit,qte) VALUES (?,?,?,?,?,?,?,?)",
        uidSeq("sil"), fid, olRef[l.produitId], oid, "p" + l.produitId, l.nom, Number(l.prixUnit) || 0, Number(l.qte) || 0);
      ins("UPDATE purchase_order_lines SET qte_facturee=qte_facturee+? WHERE id=?", Number(l.qte) || 0, olRef[l.produitId]);
    }
    for (const pay of (J(p.payments_json) || [])) {
      if (pay.canceled) continue;
      ins("INSERT INTO purchase_payments (id,invoice_id,date,montant,mode) VALUES (?,?,?,?,?)",
        uidSeq("pp"), fid, pay.date || p.date, Number(pay.montant) || 0, pay.mode || "Espèces");
    }
  }
}

/* ---------- 10) Traçabilité (audit) ---------- */
for (const a of q("SELECT * FROM audit_logs"))
  ins("INSERT INTO audit_log (id,user_id,user_nom,action,cible,date) VALUES (?,?,?,?,?,?)",
    "a" + a.id, a.user_id ? "u" + a.user_id : null, a.user_label, (a.module || "") + "/" + (a.action || ""), a.object_label, a.created_at);

/* ---------- 11) Recalcul des statuts ---------- */
function recalc(table, lineTable, qtyCols) {
  const orders = []; const s = v3.prepare(`SELECT id FROM ${table}`); while (s.step()) orders.push(s.getAsObject().id); s.free();
  for (const id of orders) {
    const ls = []; const st = v3.prepare(`SELECT * FROM ${lineTable} WHERE order_id=?`); st.bind([id]); while (st.step()) ls.push(st.getAsObject()); st.free();
    const done = ls.every((l) => l[qtyCols[0]] >= l.qte_commandee) && ls.every((l) => l.qte_facturee >= l.qte_commandee);
    const started = ls.some((l) => l[qtyCols[0]] > 0 || l.qte_facturee > 0);
    v3.run(`UPDATE ${table} SET statut=? WHERE id=?`, [done ? "complet" : started ? "partiel" : "ouvert", id]);
  }
}
recalc("sales_orders", "sales_order_lines", ["qte_livree"]);
recalc("purchase_orders", "purchase_order_lines", ["qte_recue"]);

/* ---------- 12) Export .db + dump SQL ---------- */
writeFileSync(OUT_DB, Buffer.from(v3.export()));
// dump SQL portable
const tables = ["settings","roles","users","suppliers","clients","products","stock_movements",
  "purchase_orders","purchase_order_lines","receptions","reception_lines","supplier_invoices","supplier_invoice_lines","purchase_payments",
  "sales_orders","sales_order_lines","deliveries","delivery_lines","customer_invoices","customer_invoice_lines","sale_payments","audit_log"];
let dump = "-- DrogueriePro v3 — données migrées depuis l'ancienne sauvegarde\n";
for (const t of tables) {
  const rows = []; const s = v3.prepare(`SELECT * FROM ${t}`); while (s.step()) rows.push(s.getAsObject()); s.free();
  if (!rows.length) continue;
  const cols = Object.keys(rows[0]);
  for (const r of rows) {
    const vals = cols.map((c) => r[c] == null ? "NULL" : typeof r[c] === "number" ? r[c] : `'${String(r[c]).replace(/'/g, "''")}'`);
    dump += `INSERT INTO ${t} (${cols.join(",")}) VALUES (${vals.join(",")});\n`;
  }
}
writeFileSync(OUT_SQL, dump);

/* ---------- Rapport ---------- */
const cnt = (t) => { const st = v3.prepare(`SELECT COUNT(*) n FROM ${t}`); st.step(); const n = st.getAsObject().n; st.free(); return n; };
console.log("Migration terminée →", OUT_DB, "et", OUT_SQL);
for (const t of tables) console.log("  " + t.padEnd(24), cnt(t));
process.exit(0);
