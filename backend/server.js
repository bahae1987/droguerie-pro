/* =====================================================================
 *  DrogueriePro — Backend API v3
 *  Partiel (réception/facturation) + créances/dettes + pièces jointes
 *  + charges/déplacements (marge nette) + date d'expiration.
 * ===================================================================== */
import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { readFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(process.env.DB_FILE || "droguerie.db");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get()) {
  db.exec(readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  console.log("✅ Base de données initialisée (schema v3).");
}
const app = express();
app.use(cors());
app.use(express.json());
const uid = () => randomUUID();
const now = () => new Date().toISOString();

/* ---------- Auth & permissions ---------- */
const userPerms = (u) => { const r = db.prepare("SELECT * FROM roles WHERE id=?").get(u.role_id); return r ? JSON.parse(r.permissions || "{}") : {}; };
const canDo = (p, k) => p["*"] === true || p[k] === true;
const audit = (u, a, c) => db.prepare("INSERT INTO audit_log (id,user_id,user_nom,action,cible,date) VALUES (?,?,?,?,?,?)").run(uid(), u?.id, u?.nom, a, c || null, now());
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Non authentifié" });
  try { const p = jwt.verify(token, JWT_SECRET); const u = db.prepare("SELECT * FROM users WHERE id=? AND actif=1").get(p.sub); if (!u) return res.status(401).json({ error: "Utilisateur inactif" }); req.user = u; req.perms = userPerms(u); next(); }
  catch { return res.status(401).json({ error: "Session expirée" }); }
}
const need = (k) => (req, res, next) => canDo(req.perms, k) ? next() : res.status(403).json({ error: "Accès refusé", permission: k });

/* ---------- Numérotation & totaux ---------- */
function nextNumber(col, prefix, year) { const s = db.prepare("SELECT * FROM settings WHERE id=1").get(); const n = s[col]; db.prepare(`UPDATE settings SET ${col}=? WHERE id=1`).run(n + 1); return `${prefix}-${year}-${String(n).padStart(4, "0")}`; }
const roundH = (lignes, taux, ttc) => { const base = lignes.reduce((a, l) => a + l.prix_unit * (l.qte ?? l.qte_commandee), 0); if (ttc) { const t = base, ht = t / (1 + taux / 100); return { total_ht: ht, tva: t - ht, total_ttc: t }; } const ht = base, tva = ht * taux / 100; return { total_ht: ht, tva, total_ttc: ht + tva }; };
const paiementsReste = (table, invId, ttc) => { const paye = db.prepare(`SELECT COALESCE(SUM(montant),0) v FROM ${table} WHERE invoice_id=?`).get(invId).v; return { paye, reste: Math.max(0, ttc - paye), statut: paye <= 0.01 ? "non réglée" : ttc - paye <= 0.01 ? "réglée" : "partielle" }; };

/* =====================================================================
 *  AUTH
 * ===================================================================== */
app.post("/api/auth/login", (req, res) => {
  const { login, password } = req.body;
  const u = db.prepare("SELECT * FROM users WHERE login=? AND actif=1").get(login);
  if (!u || !bcrypt.compareSync(password, u.password_hash)) return res.status(401).json({ error: "Identifiants incorrects" });
  db.prepare("UPDATE users SET last_login=? WHERE id=?").run(now(), u.id);
  const role = db.prepare("SELECT * FROM roles WHERE id=?").get(u.role_id); audit(u, "auth.login");
  res.json({ token: jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: "12h" }), user: { id: u.id, nom: u.nom, login: u.login, role: role?.nom, code: role?.code }, permissions: JSON.parse(role?.permissions || "{}") });
});
app.get("/api/auth/me", auth, (req, res) => { const role = db.prepare("SELECT * FROM roles WHERE id=?").get(req.user.role_id); res.json({ user: { id: req.user.id, nom: req.user.nom, login: req.user.login, role: role?.nom, code: role?.code }, permissions: req.perms }); });
app.post("/api/auth/password", auth, (req, res) => { const { ancien, nouveau } = req.body; if (!bcrypt.compareSync(ancien, req.user.password_hash)) return res.status(400).json({ error: "Ancien mot de passe incorrect" }); db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(bcrypt.hashSync(nouveau, 10), req.user.id); res.json({ ok: true }); });

/* =====================================================================
 *  UTILISATEURS & RÔLES
 * ===================================================================== */
app.get("/api/roles", auth, need("users.read"), (req, res) => res.json(db.prepare("SELECT * FROM roles").all().map((r) => ({ ...r, permissions: JSON.parse(r.permissions) }))));
app.post("/api/roles", auth, need("users.write"), (req, res) => { const id = uid(); db.prepare("INSERT INTO roles (id,nom,code,permissions,systeme) VALUES (?,?,?,?,0)").run(id, req.body.nom, req.body.code, JSON.stringify(req.body.permissions || {})); res.json({ id }); });
app.put("/api/roles/:id", auth, need("users.write"), (req, res) => { db.prepare("UPDATE roles SET nom=?, permissions=? WHERE id=?").run(req.body.nom, JSON.stringify(req.body.permissions || {}), req.params.id); res.json({ ok: true }); });
app.get("/api/users", auth, need("users.read"), (req, res) => res.json(db.prepare("SELECT u.id,u.nom,u.login,u.email,u.actif,u.last_login,r.nom role_nom,u.role_id FROM users u LEFT JOIN roles r ON r.id=u.role_id").all()));
app.post("/api/users", auth, need("users.write"), (req, res) => { const id = uid(); const { nom, login, email, password, role_id } = req.body; db.prepare("INSERT INTO users (id,nom,login,email,password_hash,role_id,actif) VALUES (?,?,?,?,?,?,1)").run(id, nom, login, email || null, bcrypt.hashSync(password || "changeme", 10), role_id); audit(req.user, "user.create", login); res.json({ id }); });
app.put("/api/users/:id", auth, need("users.write"), (req, res) => { const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id); if (!u) return res.status(404).json({ error: "Introuvable" }); const { nom, email, role_id, actif, password } = req.body; db.prepare("UPDATE users SET nom=?, email=?, role_id=?, actif=? WHERE id=?").run(nom ?? u.nom, email ?? u.email, role_id ?? u.role_id, actif ?? u.actif, req.params.id); if (password) db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(bcrypt.hashSync(password, 10), req.params.id); res.json({ ok: true }); });
app.delete("/api/users/:id", auth, need("users.write"), (req, res) => { if (req.params.id === req.user.id) return res.status(400).json({ error: "Auto-suppression interdite" }); db.prepare("DELETE FROM users WHERE id=?").run(req.params.id); res.json({ ok: true }); });
app.get("/api/audit", auth, need("users.read"), (req, res) => res.json(db.prepare("SELECT * FROM audit_log ORDER BY date DESC LIMIT 200").all()));

/* =====================================================================
 *  CRUD produits / clients / fournisseurs  (+ date_expiration, plafond)
 * ===================================================================== */
function crud(path_, table, readP, writeP, fields) {
  app.get(`/api/${path_}`, auth, need(readP), (req, res) => res.json(db.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC`).all()));
  app.post(`/api/${path_}`, auth, need(writeP), (req, res) => { const id = req.body.id || uid(); const cols = ["id", ...fields]; db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`).run(...cols.map((c) => c === "id" ? id : req.body[c] ?? null)); audit(req.user, `${path_}.create`, req.body.nom || id); res.json({ id }); });
  app.put(`/api/${path_}/:id`, auth, need(writeP), (req, res) => { db.prepare(`UPDATE ${table} SET ${fields.map((f) => `${f}=?`).join(",")} WHERE id=?`).run(...fields.map((f) => req.body[f] ?? null), req.params.id); res.json({ ok: true }); });
  app.delete(`/api/${path_}/:id`, auth, need(writeP), (req, res) => { db.prepare(`DELETE FROM ${table} WHERE id=?`).run(req.params.id); res.json({ ok: true }); });
}
crud("products", "products", "products.read", "products.write", ["ref", "nom", "categorie", "fournisseur_id", "prix_achat", "prix_vente", "quantite", "stock_min", "unite", "date_expiration", "nom_ar"]);
crud("clients", "clients", "clients.read", "clients.write", ["nom", "type", "ice", "tel", "ville", "adresse", "plafond_credit"]);
crud("suppliers", "suppliers", "suppliers.read", "suppliers.write", ["nom", "ice", "tel", "ville", "contact"]);
app.post("/api/products/:id/stock", auth, need("products.write"), (req, res) => { const { qte, motif } = req.body; db.prepare("UPDATE products SET quantite=quantite+? WHERE id=?").run(qte, req.params.id); db.prepare("INSERT INTO stock_movements (id,produit_id,type,qte,motif,date) VALUES (?,?,?,?,?,?)").run(uid(), req.params.id, "entree", qte, motif || "Entrée rapide", now()); res.json({ ok: true }); });
app.get("/api/settings", auth, (req, res) => res.json(db.prepare("SELECT * FROM settings WHERE id=1").get()));
app.put("/api/settings", auth, need("settings.write"), (req, res) => { const s = db.prepare("SELECT * FROM settings WHERE id=1").get(); const f = ["nom_entreprise", "ice", "rc", "adresse", "ville", "tel", "tva", "lang"]; db.prepare(`UPDATE settings SET ${f.map((k) => `${k}=?`).join(",")} WHERE id=1`).run(...f.map((k) => req.body[k] ?? s[k])); res.json({ ok: true }); });
// Produits proches de la péremption
app.get("/api/products/peremption", auth, need("products.read"), (req, res) => { const j = Number(req.query.jours ?? 90); res.json(db.prepare("SELECT * FROM v_peremption WHERE jours_restants <= ? ORDER BY jours_restants ASC").all(j)); });

/* ---------- Recalcul statut ---------- */
function recalcPO(id) { const ls = db.prepare("SELECT * FROM purchase_order_lines WHERE order_id=?").all(id); const recu = ls.every((l) => l.qte_recue >= l.qte_commandee); const fact = ls.every((l) => l.qte_facturee >= l.qte_commandee); const started = ls.some((l) => l.qte_recue > 0 || l.qte_facturee > 0); db.prepare("UPDATE purchase_orders SET statut=? WHERE id=?").run(recu && fact ? "complet" : started ? "partiel" : "ouvert", id); }
function recalcSO(id) { const ls = db.prepare("SELECT * FROM sales_order_lines WHERE order_id=?").all(id); const liv = ls.every((l) => l.qte_livree >= l.qte_commandee); const fact = ls.every((l) => l.qte_facturee >= l.qte_commandee); const started = ls.some((l) => l.qte_livree > 0 || l.qte_facturee > 0); db.prepare("UPDATE sales_orders SET statut=? WHERE id=?").run(liv && fact ? "complet" : started ? "partiel" : "ouvert", id); }

/* =====================================================================
 *  ACHATS — commandes, réceptions (partiel), factures (partiel)
 * ===================================================================== */
function loadPO(id) { const o = db.prepare("SELECT * FROM purchase_orders WHERE id=?").get(id); if (!o) return null; o.lignes = db.prepare("SELECT *, (qte_commandee-qte_recue) reste_a_recevoir, (qte_commandee-qte_facturee) reste_facturer_cmd, (qte_recue-qte_facturee) reste_facturer_rec FROM purchase_order_lines WHERE order_id=?").all(id); return o; }
app.get("/api/purchase-orders", auth, need("purchases.read"), (req, res) => res.json(db.prepare("SELECT * FROM purchase_orders ORDER BY created_at DESC").all().map((o) => loadPO(o.id))));
app.get("/api/purchase-orders/pending", auth, need("purchases.read"), (req, res) => { const { fournisseur_id, type, base } = req.query; const rows = db.prepare("SELECT * FROM v_achat_restes WHERE fournisseur_id=?").all(fournisseur_id); res.json(rows.map((r) => ({ ...r, reste: type === "reception" ? r.reste_a_recevoir : base === "commande" ? r.reste_facturer_cmd : r.reste_facturer_rec })).filter((r) => r.reste > 0.0001)); });
app.post("/api/purchase-orders", auth, need("purchases.write"), (req, res) => {
  const { date, fournisseur_id, taux_tva, lignes } = req.body;
  const f = db.prepare("SELECT * FROM suppliers WHERE id=?").get(fournisseur_id);
  const t = roundH(lignes.map((l) => ({ ...l, qte: l.qte })), taux_tva, false); const id = uid(); const year = (date || now()).slice(0, 4);
  db.transaction(() => { const num = nextNumber("c_cf", "CF", year); db.prepare("INSERT INTO purchase_orders (id,date,fournisseur_id,fournisseur_nom,fournisseur_ice,num_commande,taux_tva,total_ht,tva,total_ttc,statut) VALUES (?,?,?,?,?,?,?,?,?,?, 'ouvert')").run(id, date, fournisseur_id, f?.nom, f?.ice, num, taux_tva, t.total_ht, t.tva, t.total_ttc); for (const l of lignes) db.prepare("INSERT INTO purchase_order_lines (id,order_id,produit_id,ref,nom,prix_unit,qte_commandee) VALUES (?,?,?,?,?,?,?)").run(uid(), id, l.produit_id, l.ref, l.nom, l.prix_unit, l.qte); })();
  audit(req.user, "po.create", id); res.json(loadPO(id));
});
app.delete("/api/purchase-orders/:id", auth, need("purchases.delete"), (req, res) => { const o = loadPO(req.params.id); if (!o) return res.status(404).json({ error: "Introuvable" }); if (o.lignes.some((l) => l.qte_recue > 0 || l.qte_facturee > 0)) return res.status(400).json({ error: "Commande déjà traitée : supprimez d'abord réceptions/factures." }); db.prepare("DELETE FROM purchase_orders WHERE id=?").run(req.params.id); res.json({ ok: true }); });

function loadReception(id) { const r = db.prepare("SELECT * FROM receptions WHERE id=?").get(id); if (!r) return null; r.lignes = db.prepare("SELECT * FROM reception_lines WHERE reception_id=?").all(id); return r; }
app.get("/api/receptions", auth, need("purchases.read"), (req, res) => res.json(db.prepare("SELECT * FROM receptions ORDER BY created_at DESC").all().map((r) => loadReception(r.id))));
app.post("/api/receptions", auth, need("purchases.write"), (req, res) => {
  const { date, fournisseur_id, note, lignes } = req.body; if (!lignes?.length) return res.status(400).json({ error: "Aucune ligne" });
  const alerts = []; const id = uid(); const year = (date || now()).slice(0, 4); const f = db.prepare("SELECT * FROM suppliers WHERE id=?").get(fournisseur_id);
  try { db.transaction(() => {
    const num = nextNumber("c_br", "BR", year); let totalHT = 0;
    db.prepare("INSERT INTO receptions (id,date,fournisseur_id,fournisseur_nom,num_reception,note,total_ht) VALUES (?,?,?,?,?,?,0)").run(id, date, fournisseur_id, f?.nom, num, note || null);
    for (const li of lignes) { const ol = db.prepare("SELECT ol.*, po.fournisseur_id fid FROM purchase_order_lines ol JOIN purchase_orders po ON po.id=ol.order_id WHERE ol.id=?").get(li.order_line_id);
      if (!ol) throw { code: 400, msg: "Ligne introuvable" }; if (ol.fid !== fournisseur_id) throw { code: 400, msg: "Fournisseur différent" };
      const qte = Number(li.qte); if (qte <= 0) continue; const prix = li.prix_unit != null ? Number(li.prix_unit) : ol.prix_unit;
      if (ol.qte_recue + qte > ol.qte_commandee + 0.0001) alerts.push(`Sur-réception « ${ol.nom} » : ${ol.qte_recue + qte}/${ol.qte_commandee}.`);
      db.prepare("INSERT INTO reception_lines (id,reception_id,order_line_id,order_id,produit_id,nom,prix_unit,qte) VALUES (?,?,?,?,?,?,?,?)").run(uid(), id, ol.id, ol.order_id, ol.produit_id, ol.nom, prix, qte);
      db.prepare("UPDATE purchase_order_lines SET qte_recue=qte_recue+? WHERE id=?").run(qte, ol.id);
      db.prepare("UPDATE products SET quantite=quantite+?, prix_achat=? WHERE id=?").run(qte, prix, ol.produit_id);
      db.prepare("INSERT INTO stock_movements (id,produit_id,type,qte,motif,date) VALUES (?,?,?,?,?,?)").run(uid(), ol.produit_id, "entree", qte, num, now()); totalHT += prix * qte; }
    db.prepare("UPDATE receptions SET total_ht=? WHERE id=?").run(totalHT, id);
    [...new Set(lignes.map((li) => db.prepare("SELECT order_id FROM purchase_order_lines WHERE id=?").get(li.order_line_id)?.order_id))].forEach((o) => o && recalcPO(o));
  })(); } catch (e) { return res.status(e.code || 500).json({ error: e.msg || "Erreur réception" }); }
  audit(req.user, "reception.create", id); res.json({ reception: loadReception(id), alerts });
});
app.delete("/api/receptions/:id", auth, need("purchases.delete"), (req, res) => { const r = loadReception(req.params.id); if (!r) return res.status(404).json({ error: "Introuvable" }); db.transaction(() => { for (const l of r.lignes) { db.prepare("UPDATE purchase_order_lines SET qte_recue=MAX(0,qte_recue-?) WHERE id=?").run(l.qte, l.order_line_id); db.prepare("UPDATE products SET quantite=MAX(0,quantite-?) WHERE id=?").run(l.qte, l.produit_id); } const o = [...new Set(r.lignes.map((l) => l.order_id))]; db.prepare("DELETE FROM receptions WHERE id=?").run(req.params.id); o.forEach(recalcPO); })(); res.json({ ok: true }); });

function loadSI(id) { const s = db.prepare("SELECT * FROM supplier_invoices WHERE id=?").get(id); if (!s) return null; s.lignes = db.prepare("SELECT * FROM supplier_invoice_lines WHERE invoice_id=?").all(id); s.paiements = db.prepare("SELECT * FROM purchase_payments WHERE invoice_id=? ORDER BY date").all(id); s.reglement = paiementsReste("purchase_payments", id, s.total_ttc); return s; }
app.get("/api/supplier-invoices", auth, need("purchases.read"), (req, res) => res.json(db.prepare("SELECT * FROM supplier_invoices ORDER BY created_at DESC").all().map((s) => loadSI(s.id))));
app.post("/api/supplier-invoices", auth, need("purchases.write"), (req, res) => {
  const { date, fournisseur_id, base, taux_tva, lignes } = req.body; if (!lignes?.length) return res.status(400).json({ error: "Aucune ligne" });
  const alerts = []; const id = uid(); const year = (date || now()).slice(0, 4); const f = db.prepare("SELECT * FROM suppliers WHERE id=?").get(fournisseur_id);
  try { db.transaction(() => {
    const num = nextNumber("c_ff", "FF", year);
    for (const li of lignes) { const ol = db.prepare("SELECT ol.*, po.fournisseur_id fid FROM purchase_order_lines ol JOIN purchase_orders po ON po.id=ol.order_id WHERE ol.id=?").get(li.order_line_id);
      if (!ol) throw { code: 400, msg: "Ligne introuvable" }; if (ol.fid !== fournisseur_id) throw { code: 400, msg: "Fournisseur différent" };
      const qte = Number(li.qte); if (qte <= 0) continue; const dispo = base === "commande" ? ol.qte_commandee - ol.qte_facturee : ol.qte_recue - ol.qte_facturee;
      if (qte > dispo + 0.0001) alerts.push(`Facturation « ${ol.nom} » : ${qte} demandés, ${dispo} facturables.`);
      const prix = li.prix_unit != null ? Number(li.prix_unit) : ol.prix_unit;
      db.prepare("INSERT INTO supplier_invoice_lines (id,invoice_id,order_line_id,order_id,produit_id,nom,prix_unit,qte) VALUES (?,?,?,?,?,?,?,?)").run(uid(), id, ol.id, ol.order_id, ol.produit_id, ol.nom, prix, qte);
      db.prepare("UPDATE purchase_order_lines SET qte_facturee=qte_facturee+? WHERE id=?").run(qte, ol.id); }
    const inv = db.prepare("SELECT prix_unit, qte FROM supplier_invoice_lines WHERE invoice_id=?").all(id); const t = roundH(inv, taux_tva, false);
    db.prepare("INSERT INTO supplier_invoices (id,date,fournisseur_id,fournisseur_nom,fournisseur_ice,num_facture,base,taux_tva,total_ht,tva,total_ttc) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(id, date, fournisseur_id, f?.nom, f?.ice, num, base, taux_tva, t.total_ht, t.tva, t.total_ttc);
    [...new Set(lignes.map((li) => db.prepare("SELECT order_id FROM purchase_order_lines WHERE id=?").get(li.order_line_id)?.order_id))].forEach((o) => o && recalcPO(o));
  })(); } catch (e) { return res.status(e.code || 500).json({ error: e.msg || "Erreur facture" }); }
  audit(req.user, "supplier_invoice.create", id); res.json({ invoice: loadSI(id), alerts });
});
app.post("/api/supplier-invoices/:id/pay", auth, need("purchases.pay"), (req, res) => { const { montant, mode, date, note } = req.body; db.prepare("INSERT INTO purchase_payments (id,invoice_id,date,montant,mode,note) VALUES (?,?,?,?,?,?)").run(uid(), req.params.id, date || now().slice(0, 10), montant, mode, note || null); res.json(loadSI(req.params.id)); });
// ANNULATION d'un règlement (corrige le bug : la facture redevient non soldée / modifiable)
app.delete("/api/supplier-invoices/:id/pay/:payId", auth, need("purchases.pay"), (req, res) => { db.prepare("DELETE FROM purchase_payments WHERE id=? AND invoice_id=?").run(req.params.payId, req.params.id); audit(req.user, "supplier_payment.cancel", req.params.payId); res.json(loadSI(req.params.id)); });
app.delete("/api/supplier-invoices/:id", auth, need("purchases.delete"), (req, res) => { const s = loadSI(req.params.id); if (!s) return res.status(404).json({ error: "Introuvable" }); db.transaction(() => { for (const l of s.lignes) db.prepare("UPDATE purchase_order_lines SET qte_facturee=MAX(0,qte_facturee-?) WHERE id=?").run(l.qte, l.order_line_id); const o = [...new Set(s.lignes.map((l) => l.order_id))]; db.prepare("DELETE FROM supplier_invoices WHERE id=?").run(req.params.id); o.forEach(recalcPO); })(); res.json({ ok: true }); });

/* =====================================================================
 *  VENTES — commandes, BL (partiel), factures (partiel) + coût marge
 * ===================================================================== */
function loadSO(id) { const o = db.prepare("SELECT * FROM sales_orders WHERE id=?").get(id); if (!o) return null; o.lignes = db.prepare("SELECT *, (qte_commandee-qte_livree) reste_a_livrer, (qte_commandee-qte_facturee) reste_facturer_cmd, (qte_livree-qte_facturee) reste_facturer_liv FROM sales_order_lines WHERE order_id=?").all(id); return o; }
app.get("/api/sales-orders", auth, need("sales.read"), (req, res) => res.json(db.prepare("SELECT * FROM sales_orders ORDER BY created_at DESC").all().map((o) => loadSO(o.id))));
app.get("/api/sales-orders/pending", auth, need("sales.read"), (req, res) => { const { client_id, type, base } = req.query; const rows = db.prepare("SELECT * FROM v_vente_restes WHERE client_id=?").all(client_id); res.json(rows.map((r) => ({ ...r, reste: type === "livraison" ? r.reste_a_livrer : base === "commande" ? r.reste_facturer_cmd : r.reste_facturer_liv })).filter((r) => r.reste > 0.0001)); });
app.post("/api/sales-orders", auth, need("sales.write"), (req, res) => {
  const { date, client_id, taux_tva, lignes, stage = "commande" } = req.body; const c = db.prepare("SELECT * FROM clients WHERE id=?").get(client_id);
  const t = roundH(lignes.map((l) => ({ ...l, qte: l.qte })), taux_tva, true); const id = uid(); const year = (date || now()).slice(0, 4);
  db.transaction(() => { const num = stage === "devis" ? nextNumber("c_devis", "DEV", year) : nextNumber("c_commande", "BC", year); db.prepare(`INSERT INTO sales_orders (id,date,client_id,client_nom,client_ice,${stage === "devis" ? "num_devis" : "num_commande"},stage,taux_tva,total_ht,tva,total_ttc,statut) VALUES (?,?,?,?,?,?,?,?,?,?,?, 'ouvert')`).run(id, date, client_id, c?.nom, c?.ice, num, stage, taux_tva, t.total_ht, t.tva, t.total_ttc); for (const l of lignes) db.prepare("INSERT INTO sales_order_lines (id,order_id,produit_id,ref,nom,prix_unit,qte_commandee) VALUES (?,?,?,?,?,?,?)").run(uid(), id, l.produit_id, l.ref, l.nom, l.prix_unit, l.qte); })();
  audit(req.user, "so.create", id); res.json(loadSO(id));
});
app.post("/api/sales-orders/:id/confirm", auth, need("sales.write"), (req, res) => { const o = db.prepare("SELECT * FROM sales_orders WHERE id=?").get(req.params.id); if (!o || o.stage !== "devis") return res.status(400).json({ error: "Devis introuvable" }); const num = nextNumber("c_commande", "BC", o.date.slice(0, 4)); db.prepare("UPDATE sales_orders SET stage='commande', num_commande=? WHERE id=?").run(num, o.id); res.json(loadSO(o.id)); });
app.delete("/api/sales-orders/:id", auth, need("sales.delete"), (req, res) => { const o = loadSO(req.params.id); if (o.lignes.some((l) => l.qte_livree > 0 || l.qte_facturee > 0)) return res.status(400).json({ error: "Commande déjà traitée : supprimez BL/factures d'abord." }); db.prepare("DELETE FROM sales_orders WHERE id=?").run(req.params.id); res.json({ ok: true }); });

function loadDelivery(id) { const d = db.prepare("SELECT * FROM deliveries WHERE id=?").get(id); if (!d) return null; d.lignes = db.prepare("SELECT * FROM delivery_lines WHERE delivery_id=?").all(id); return d; }
app.get("/api/deliveries", auth, need("sales.read"), (req, res) => res.json(db.prepare("SELECT * FROM deliveries ORDER BY created_at DESC").all().map((d) => loadDelivery(d.id))));
app.post("/api/deliveries", auth, need("sales.write"), (req, res) => {
  const { date, client_id, note, lignes, trip_id } = req.body; if (!lignes?.length) return res.status(400).json({ error: "Aucune ligne" });
  const alerts = []; const id = uid(); const year = (date || now()).slice(0, 4); const c = db.prepare("SELECT * FROM clients WHERE id=?").get(client_id);
  try { db.transaction(() => {
    const num = nextNumber("c_bl", "BL", year); let totalHT = 0;
    db.prepare("INSERT INTO deliveries (id,date,client_id,client_nom,num_bl,note,trip_id,total_ht) VALUES (?,?,?,?,?,?,?,0)").run(id, date, client_id, c?.nom, num, note || null, trip_id || null);
    for (const li of lignes) { const ol = db.prepare("SELECT ol.*, so.client_id cid FROM sales_order_lines ol JOIN sales_orders so ON so.id=ol.order_id WHERE ol.id=?").get(li.order_line_id);
      if (!ol) throw { code: 400, msg: "Ligne introuvable" }; if (ol.cid !== client_id) throw { code: 400, msg: "Client différent" };
      const qte = Number(li.qte); if (qte <= 0) continue; const prod = db.prepare("SELECT * FROM products WHERE id=?").get(ol.produit_id);
      if (prod && qte > prod.quantite + 0.0001) throw { code: 400, msg: `Stock insuffisant « ${ol.nom} » (dispo ${prod.quantite}).` };
      if (ol.qte_livree + qte > ol.qte_commandee + 0.0001) alerts.push(`Sur-livraison « ${ol.nom} » : ${ol.qte_livree + qte}/${ol.qte_commandee}.`);
      db.prepare("INSERT INTO delivery_lines (id,delivery_id,order_line_id,order_id,produit_id,nom,prix_unit,qte) VALUES (?,?,?,?,?,?,?,?)").run(uid(), id, ol.id, ol.order_id, ol.produit_id, ol.nom, ol.prix_unit, qte);
      db.prepare("UPDATE sales_order_lines SET qte_livree=qte_livree+? WHERE id=?").run(qte, ol.id);
      db.prepare("UPDATE products SET quantite=quantite-? WHERE id=?").run(qte, ol.produit_id);
      db.prepare("INSERT INTO stock_movements (id,produit_id,type,qte,motif,date) VALUES (?,?,?,?,?,?)").run(uid(), ol.produit_id, "sortie", qte, num, now()); totalHT += ol.prix_unit * qte; }
    db.prepare("UPDATE deliveries SET total_ht=? WHERE id=?").run(totalHT, id);
    [...new Set(lignes.map((li) => db.prepare("SELECT order_id FROM sales_order_lines WHERE id=?").get(li.order_line_id)?.order_id))].forEach((o) => o && recalcSO(o));
  })(); } catch (e) { return res.status(e.code || 500).json({ error: e.msg || "Erreur livraison" }); }
  audit(req.user, "delivery.create", id); res.json({ delivery: loadDelivery(id), alerts });
});
app.delete("/api/deliveries/:id", auth, need("sales.delete"), (req, res) => { const d = loadDelivery(req.params.id); if (!d) return res.status(404).json({ error: "Introuvable" }); db.transaction(() => { for (const l of d.lignes) { db.prepare("UPDATE sales_order_lines SET qte_livree=MAX(0,qte_livree-?) WHERE id=?").run(l.qte, l.order_line_id); db.prepare("UPDATE products SET quantite=quantite+? WHERE id=?").run(l.qte, l.produit_id); } const o = [...new Set(d.lignes.map((l) => l.order_id))]; db.prepare("DELETE FROM deliveries WHERE id=?").run(req.params.id); o.forEach(recalcSO); })(); res.json({ ok: true }); });

function loadCI(id) { const s = db.prepare("SELECT * FROM customer_invoices WHERE id=?").get(id); if (!s) return null; s.lignes = db.prepare("SELECT * FROM customer_invoice_lines WHERE invoice_id=?").all(id); s.paiements = db.prepare("SELECT * FROM sale_payments WHERE invoice_id=? ORDER BY date").all(id); s.reglement = paiementsReste("sale_payments", id, s.total_ttc); return s; }
app.get("/api/customer-invoices", auth, need("sales.read"), (req, res) => res.json(db.prepare("SELECT * FROM customer_invoices ORDER BY created_at DESC").all().map((s) => loadCI(s.id))));
app.post("/api/customer-invoices", auth, need("sales.write"), (req, res) => {
  const { date, client_id, base, taux_tva, lignes, trip_id } = req.body; if (!lignes?.length) return res.status(400).json({ error: "Aucune ligne" });
  const alerts = []; const id = uid(); const year = (date || now()).slice(0, 4); const c = db.prepare("SELECT * FROM clients WHERE id=?").get(client_id);
  try { db.transaction(() => {
    const num = nextNumber("c_facture", "FAC", year);
    for (const li of lignes) { const ol = db.prepare("SELECT ol.*, so.client_id cid FROM sales_order_lines ol JOIN sales_orders so ON so.id=ol.order_id WHERE ol.id=?").get(li.order_line_id);
      if (!ol) throw { code: 400, msg: "Ligne introuvable" }; if (ol.cid !== client_id) throw { code: 400, msg: "Client différent" };
      const qte = Number(li.qte); if (qte <= 0) continue; const dispo = base === "commande" ? ol.qte_commandee - ol.qte_facturee : ol.qte_livree - ol.qte_facturee;
      if (qte > dispo + 0.0001) alerts.push(`Facturation « ${ol.nom} » : ${qte} demandés, ${dispo} facturables.`);
      const prod = db.prepare("SELECT prix_achat FROM products WHERE id=?").get(ol.produit_id);  // coût pour marge
      db.prepare("INSERT INTO customer_invoice_lines (id,invoice_id,order_line_id,order_id,produit_id,nom,prix_unit,cout_unit,qte) VALUES (?,?,?,?,?,?,?,?,?)").run(uid(), id, ol.id, ol.order_id, ol.produit_id, ol.nom, ol.prix_unit, prod?.prix_achat || 0, qte);
      db.prepare("UPDATE sales_order_lines SET qte_facturee=qte_facturee+? WHERE id=?").run(qte, ol.id); }
    const inv = db.prepare("SELECT prix_unit, qte FROM customer_invoice_lines WHERE invoice_id=?").all(id); const t = roundH(inv, taux_tva, true);
    db.prepare("INSERT INTO customer_invoices (id,date,client_id,client_nom,client_ice,num_facture,base,taux_tva,trip_id,total_ht,tva,total_ttc) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(id, date, client_id, c?.nom, c?.ice, num, base, taux_tva, trip_id || null, t.total_ht, t.tva, t.total_ttc);
    [...new Set(lignes.map((li) => db.prepare("SELECT order_id FROM sales_order_lines WHERE id=?").get(li.order_line_id)?.order_id))].forEach((o) => o && recalcSO(o));
  })(); } catch (e) { return res.status(e.code || 500).json({ error: e.msg || "Erreur facture" }); }
  audit(req.user, "customer_invoice.create", id); res.json({ invoice: loadCI(id), alerts });
});
app.post("/api/customer-invoices/:id/pay", auth, need("sales.pay"), (req, res) => { const { montant, mode, date, note } = req.body; db.prepare("INSERT INTO sale_payments (id,invoice_id,date,montant,mode,note) VALUES (?,?,?,?,?,?)").run(uid(), req.params.id, date || now().slice(0, 10), montant, mode, note || null); res.json(loadCI(req.params.id)); });
// ANNULATION d'un encaissement (corrige : la facture redevient non soldée / modifiable)
app.delete("/api/customer-invoices/:id/pay/:payId", auth, need("sales.pay"), (req, res) => { db.prepare("DELETE FROM sale_payments WHERE id=? AND invoice_id=?").run(req.params.payId, req.params.id); audit(req.user, "sale_payment.cancel", req.params.payId); res.json(loadCI(req.params.id)); });
app.delete("/api/customer-invoices/:id", auth, need("sales.delete"), (req, res) => { const s = loadCI(req.params.id); if (!s) return res.status(404).json({ error: "Introuvable" }); db.transaction(() => { for (const l of s.lignes) db.prepare("UPDATE sales_order_lines SET qte_facturee=MAX(0,qte_facturee-?) WHERE id=?").run(l.qte, l.order_line_id); const o = [...new Set(s.lignes.map((l) => l.order_id))]; db.prepare("DELETE FROM customer_invoices WHERE id=?").run(req.params.id); o.forEach(recalcSO); })(); res.json({ ok: true }); });

/* Vente directe comptoir : commande + BL + facture en une fois */
app.post("/api/sales/direct", auth, need("sales.write"), (req, res) => {
  const { date, client_id, taux_tva, lignes, trip_id } = req.body; const c = db.prepare("SELECT * FROM clients WHERE id=?").get(client_id); const year = (date || now()).slice(0, 4); let result;
  try { db.transaction(() => {
    const t = roundH(lignes.map((l) => ({ ...l, qte: l.qte })), taux_tva, true); const oid = uid(); const numBC = nextNumber("c_commande", "BC", year);
    db.prepare("INSERT INTO sales_orders (id,date,client_id,client_nom,client_ice,num_commande,stage,taux_tva,total_ht,tva,total_ttc,statut) VALUES (?,?,?,?,?,?, 'commande',?,?,?,?, 'complet')").run(oid, date, client_id, c?.nom, c?.ice, numBC, taux_tva, t.total_ht, t.tva, t.total_ttc);
    const ols = []; for (const l of lignes) { const olid = uid(); ols.push({ id: olid, l }); db.prepare("INSERT INTO sales_order_lines (id,order_id,produit_id,ref,nom,prix_unit,qte_commandee,qte_livree,qte_facturee) VALUES (?,?,?,?,?,?,?,?,?)").run(olid, oid, l.produit_id, l.ref, l.nom, l.prix_unit, l.qte, l.qte, l.qte); }
    const did = uid(); const numBL = nextNumber("c_bl", "BL", year);
    db.prepare("INSERT INTO deliveries (id,date,client_id,client_nom,num_bl,trip_id,total_ht) VALUES (?,?,?,?,?,?,?)").run(did, date, client_id, c?.nom, numBL, trip_id || null, t.total_ht);
    for (const { id: olid, l } of ols) { const prod = db.prepare("SELECT * FROM products WHERE id=?").get(l.produit_id); if (prod && l.qte > prod.quantite + 0.0001) throw { code: 400, msg: `Stock insuffisant « ${l.nom} » (dispo ${prod.quantite}).` };
      db.prepare("INSERT INTO delivery_lines (id,delivery_id,order_line_id,order_id,produit_id,nom,prix_unit,qte) VALUES (?,?,?,?,?,?,?,?)").run(uid(), did, olid, oid, l.produit_id, l.nom, l.prix_unit, l.qte);
      db.prepare("UPDATE products SET quantite=quantite-? WHERE id=?").run(l.qte, l.produit_id);
      db.prepare("INSERT INTO stock_movements (id,produit_id,type,qte,motif,date) VALUES (?,?,?,?,?,?)").run(uid(), l.produit_id, "sortie", l.qte, numBL, now()); }
    const fid = uid(); const numFAC = nextNumber("c_facture", "FAC", year);
    db.prepare("INSERT INTO customer_invoices (id,date,client_id,client_nom,client_ice,num_facture,base,taux_tva,trip_id,total_ht,tva,total_ttc) VALUES (?,?,?,?,?,?, 'livraison',?,?,?,?,?)").run(fid, date, client_id, c?.nom, c?.ice, numFAC, taux_tva, trip_id || null, t.total_ht, t.tva, t.total_ttc);
    for (const { id: olid, l } of ols) { const prod = db.prepare("SELECT prix_achat FROM products WHERE id=?").get(l.produit_id); db.prepare("INSERT INTO customer_invoice_lines (id,invoice_id,order_line_id,order_id,produit_id,nom,prix_unit,cout_unit,qte) VALUES (?,?,?,?,?,?,?,?,?)").run(uid(), fid, olid, oid, l.produit_id, l.nom, l.prix_unit, prod?.prix_achat || 0, l.qte); }
    result = { order: numBC, bl: numBL, facture: numFAC, invoiceId: fid };
  })(); } catch (e) { return res.status(e.code || 500).json({ error: e.msg || "Erreur vente directe" }); }
  audit(req.user, "sale.direct", result.facture); res.json(result);
});

/* =====================================================================
 *  MODULE CRÉANCES / DETTES  — situation par client / fournisseur
 * ===================================================================== */
// Situation globale (tous les clients) avec solde dû
app.get("/api/finance/clients", auth, need("finance.read"), (req, res) => res.json(db.prepare("SELECT * FROM v_situation_clients ORDER BY solde_du DESC").all()));
app.get("/api/finance/suppliers", auth, need("finance.read"), (req, res) => res.json(db.prepare("SELECT * FROM v_situation_fournisseurs ORDER BY solde_du DESC").all()));
// Relevé détaillé d'un client : factures + encaissements + solde courant
app.get("/api/finance/clients/:id", auth, need("finance.read"), (req, res) => {
  const c = db.prepare("SELECT * FROM clients WHERE id=?").get(req.params.id); if (!c) return res.status(404).json({ error: "Client introuvable" });
  const factures = db.prepare("SELECT ci.*, (ci.total_ttc - COALESCE((SELECT SUM(montant) FROM sale_payments WHERE invoice_id=ci.id),0)) reste FROM customer_invoices ci WHERE client_id=? ORDER BY date").all(req.params.id);
  const paiements = db.prepare("SELECT sp.* FROM sale_payments sp JOIN customer_invoices ci ON ci.id=sp.invoice_id WHERE ci.client_id=? ORDER BY sp.date").all(req.params.id);
  // Grand livre chronologique (débit = facture, crédit = règlement)
  const mvts = [
    ...factures.map((f) => ({ date: f.date, piece: f.num_facture, libelle: "Facture", debit: f.total_ttc, credit: 0 })),
    ...paiements.map((p) => ({ date: p.date, piece: p.mode, libelle: "Règlement " + (p.mode || ""), debit: 0, credit: p.montant })),
  ].sort((a, b) => (a.date < b.date ? -1 : 1));
  let solde = 0; mvts.forEach((m) => { solde += m.debit - m.credit; m.solde = solde; });
  const totFacture = factures.reduce((a, f) => a + f.total_ttc, 0), totRegle = paiements.reduce((a, p) => a + p.montant, 0);
  res.json({ client: c, factures, paiements, mouvements: mvts, total_facture: totFacture, total_regle: totRegle, solde_du: totFacture - totRegle });
});
app.get("/api/finance/suppliers/:id", auth, need("finance.read"), (req, res) => {
  const s = db.prepare("SELECT * FROM suppliers WHERE id=?").get(req.params.id); if (!s) return res.status(404).json({ error: "Fournisseur introuvable" });
  const factures = db.prepare("SELECT si.*, (si.total_ttc - COALESCE((SELECT SUM(montant) FROM purchase_payments WHERE invoice_id=si.id),0)) reste FROM supplier_invoices si WHERE fournisseur_id=? ORDER BY date").all(req.params.id);
  const paiements = db.prepare("SELECT pp.* FROM purchase_payments pp JOIN supplier_invoices si ON si.id=pp.invoice_id WHERE si.fournisseur_id=? ORDER BY pp.date").all(req.params.id);
  const mvts = [
    ...factures.map((f) => ({ date: f.date, piece: f.num_facture, libelle: "Facture", debit: f.total_ttc, credit: 0 })),
    ...paiements.map((p) => ({ date: p.date, piece: p.mode, libelle: "Règlement " + (p.mode || ""), debit: 0, credit: p.montant })),
  ].sort((a, b) => (a.date < b.date ? -1 : 1));
  let solde = 0; mvts.forEach((m) => { solde += m.debit - m.credit; m.solde = solde; });
  const totFacture = factures.reduce((a, f) => a + f.total_ttc, 0), totRegle = paiements.reduce((a, p) => a + p.montant, 0);
  res.json({ fournisseur: s, factures, paiements, mouvements: mvts, total_facture: totFacture, total_regle: totRegle, solde_du: totFacture - totRegle });
});

/* =====================================================================
 *  PIÈCES JOINTES (upload/download/list/delete) sur toute entité
 * ===================================================================== */
const storage = multer.diskStorage({ destination: UPLOAD_DIR, filename: (req, file, cb) => cb(null, uid() + path.extname(file.originalname || "")) });
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });
app.post("/api/attachments/:entityType/:entityId", auth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Aucun fichier" });
  const id = uid();
  db.prepare("INSERT INTO attachments (id,entity_type,entity_id,filename,original_name,mime,size,uploaded_by) VALUES (?,?,?,?,?,?,?,?)")
    .run(id, req.params.entityType, req.params.entityId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.user.nom);
  audit(req.user, "attachment.add", `${req.params.entityType}:${req.params.entityId}`);
  res.json(db.prepare("SELECT id,entity_type,entity_id,original_name,mime,size,uploaded_by,created_at FROM attachments WHERE id=?").get(id));
});
app.get("/api/attachments/:entityType/:entityId", auth, (req, res) => res.json(db.prepare("SELECT id,entity_type,entity_id,original_name,mime,size,uploaded_by,created_at FROM attachments WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC").all(req.params.entityType, req.params.entityId)));
app.get("/api/attachments/file/:id", auth, (req, res) => { const a = db.prepare("SELECT * FROM attachments WHERE id=?").get(req.params.id); if (!a) return res.status(404).json({ error: "Introuvable" }); res.download(path.join(UPLOAD_DIR, a.filename), a.original_name); });
app.delete("/api/attachments/:id", auth, (req, res) => { const a = db.prepare("SELECT * FROM attachments WHERE id=?").get(req.params.id); if (!a) return res.status(404).json({ error: "Introuvable" }); try { unlinkSync(path.join(UPLOAD_DIR, a.filename)); } catch {} db.prepare("DELETE FROM attachments WHERE id=?").run(req.params.id); res.json({ ok: true }); });

/* =====================================================================
 *  CHARGES & DÉPLACEMENTS — marge nette par déplacement
 * ===================================================================== */
const CATEGORIES_CHARGE = ["Transport", "Carburant", "Nourriture", "Personnel", "Péage", "Hébergement", "Autre"];
app.get("/api/expense-categories", auth, (req, res) => res.json(CATEGORIES_CHARGE));

// Déplacements (tournées)
app.get("/api/trips", auth, need("expenses.read"), (req, res) => res.json(db.prepare("SELECT * FROM trips ORDER BY date DESC").all()));
app.post("/api/trips", auth, need("expenses.write"), (req, res) => { const { date, libelle, destination, responsable, vehicule, note } = req.body; const id = uid(); const num = nextNumber("c_dep", "DEP", (date || now()).slice(0, 4)); db.prepare("INSERT INTO trips (id,num_dep,date,libelle,destination,responsable,vehicule,note,statut) VALUES (?,?,?,?,?,?,?,?, 'ouvert')").run(id, num, date, libelle, destination || null, responsable || null, vehicule || null, note || null); audit(req.user, "trip.create", num); res.json(db.prepare("SELECT * FROM trips WHERE id=?").get(id)); });
app.put("/api/trips/:id", auth, need("expenses.write"), (req, res) => { const f = ["date", "libelle", "destination", "responsable", "vehicule", "note", "statut"]; const cur = db.prepare("SELECT * FROM trips WHERE id=?").get(req.params.id); db.prepare(`UPDATE trips SET ${f.map((k) => `${k}=?`).join(",")} WHERE id=?`).run(...f.map((k) => req.body[k] ?? cur[k]), req.params.id); res.json({ ok: true }); });
app.delete("/api/trips/:id", auth, need("expenses.write"), (req, res) => { db.prepare("UPDATE expenses SET trip_id=NULL WHERE trip_id=?").run(req.params.id); db.prepare("UPDATE customer_invoices SET trip_id=NULL WHERE trip_id=?").run(req.params.id); db.prepare("DELETE FROM trips WHERE id=?").run(req.params.id); res.json({ ok: true }); });

// Charges
app.get("/api/expenses", auth, need("expenses.read"), (req, res) => { const { trip_id } = req.query; const rows = trip_id ? db.prepare("SELECT * FROM expenses WHERE trip_id=? ORDER BY date DESC").all(trip_id) : db.prepare("SELECT * FROM expenses ORDER BY date DESC").all(); res.json(rows); });
app.post("/api/expenses", auth, need("expenses.write"), (req, res) => { const { date, categorie, libelle, montant, trip_id, beneficiaire, mode } = req.body; const id = uid(); const num = nextNumber("c_chg", "CHG", (date || now()).slice(0, 4)); db.prepare("INSERT INTO expenses (id,num_chg,date,categorie,libelle,montant,trip_id,beneficiaire,mode) VALUES (?,?,?,?,?,?,?,?,?)").run(id, num, date, categorie, libelle || null, montant, trip_id || null, beneficiaire || null, mode || null); audit(req.user, "expense.create", num); res.json(db.prepare("SELECT * FROM expenses WHERE id=?").get(id)); });
app.put("/api/expenses/:id", auth, need("expenses.write"), (req, res) => { const f = ["date", "categorie", "libelle", "montant", "trip_id", "beneficiaire", "mode"]; const cur = db.prepare("SELECT * FROM expenses WHERE id=?").get(req.params.id); db.prepare(`UPDATE expenses SET ${f.map((k) => `${k}=?`).join(",")} WHERE id=?`).run(...f.map((k) => req.body[k] ?? cur[k]), req.params.id); res.json({ ok: true }); });
app.delete("/api/expenses/:id", auth, need("expenses.write"), (req, res) => { db.prepare("DELETE FROM expenses WHERE id=?").run(req.params.id); res.json({ ok: true }); });

// MARGE NETTE d'un déplacement : CA - coût d'achat (COGS) - charges
app.get("/api/trips/:id/margin", auth, need("expenses.read"), (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id=?").get(req.params.id); if (!trip) return res.status(404).json({ error: "Déplacement introuvable" });
  const factures = db.prepare("SELECT * FROM customer_invoices WHERE trip_id=?").all(req.params.id);
  const ca_ttc = factures.reduce((a, f) => a + f.total_ttc, 0);
  const ca_ht = factures.reduce((a, f) => a + f.total_ht, 0);
  // COGS : somme (cout_unit * qte) des lignes des factures du déplacement
  let cout_achat = 0, marge_brute = 0;
  for (const f of factures) { const ls = db.prepare("SELECT * FROM customer_invoice_lines WHERE invoice_id=?").all(f.id); for (const l of ls) { cout_achat += (l.cout_unit || 0) * l.qte; marge_brute += (l.prix_unit / (1 + f.taux_tva / 100) - (l.cout_unit || 0)) * l.qte; } }
  const charges = db.prepare("SELECT COALESCE(SUM(montant),0) v FROM expenses WHERE trip_id=?").get(req.params.id).v;
  const detailCharges = db.prepare("SELECT categorie, SUM(montant) total FROM expenses WHERE trip_id=? GROUP BY categorie").all(req.params.id);
  const marge_nette = marge_brute - charges;
  res.json({ trip, nb_factures: factures.length, ca_ttc, ca_ht, cout_achat, marge_brute, total_charges: charges, detail_charges: detailCharges, marge_nette, taux_marge: ca_ht ? (marge_nette / ca_ht) * 100 : 0 });
});

/* =====================================================================
 *  Tableau de bord
 * ===================================================================== */
app.get("/api/dashboard", auth, need("dashboard.read"), (req, res) => {
  const month = now().slice(0, 7), today = now().slice(0, 10);
  const caMonth = db.prepare("SELECT COALESCE(SUM(total_ttc),0) v FROM customer_invoices WHERE substr(date,1,7)=?").get(month).v;
  const caToday = db.prepare("SELECT COALESCE(SUM(total_ttc),0) v FROM customer_invoices WHERE date=?").get(today).v;
  const stockValue = db.prepare("SELECT COALESCE(SUM(quantite*prix_achat),0) v FROM products").get().v;
  const creances = db.prepare("SELECT COALESCE(SUM(reste),0) v FROM v_creances").get().v;
  const dettes = db.prepare("SELECT COALESCE(SUM(reste),0) v FROM v_dettes").get().v;
  const chargesMonth = db.prepare("SELECT COALESCE(SUM(montant),0) v FROM expenses WHERE substr(date,1,7)=?").get(month).v;
  const alertes = db.prepare("SELECT * FROM v_alertes_stock").all();
  const perim = db.prepare("SELECT * FROM v_peremption WHERE jours_restants <= 30 ORDER BY jours_restants ASC").all();
  res.json({ caMonth, caToday, stockValue, creances, dettes, chargesMonth, alertes, peremptions: perim });
});

app.listen(PORT, () => console.log(`🚀 API DrogueriePro v3 sur http://localhost:${PORT}`));
