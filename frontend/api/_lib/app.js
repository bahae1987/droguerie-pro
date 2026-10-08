/* =====================================================================
 *  DrogueriePro — Backend API v3 (PostgreSQL / Supabase)
 *  Prêt à déployer sur Render. Lit DATABASE_URL (chaîne Supabase).
 * ===================================================================== */
import express from "express";
import cors from "cors";
import pkg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { randomUUID } from "crypto";

const { Pool } = pkg;
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const PORT = process.env.PORT || 4000;
if (!process.env.DATABASE_URL) console.warn("⚠ DATABASE_URL manquant : définissez la chaîne de connexion Supabase.");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },           // requis par Supabase
  max: Number(process.env.PG_MAX || 2),         // adapté au serverless (Vercel) et à Render
  idleTimeoutMillis: 10000,
  keepAlive: true,
});

/* ---------- Helpers : ? -> $1,$2… + accès ---------- */
const sqlize = (t) => { let i = 0; return t.replace(/\?/g, () => `$${++i}`); };
const run = (t, p = []) => pool.query(sqlize(t), p);
const get = async (t, p = []) => (await pool.query(sqlize(t), p)).rows[0];
const all = async (t, p = []) => (await pool.query(sqlize(t), p)).rows;
async function tx(fn) {
  const c = await pool.connect();
  const crun = (t, p = []) => c.query(sqlize(t), p);
  const api = { run: crun, get: async (t, p = []) => (await crun(t, p)).rows[0], all: async (t, p = []) => (await crun(t, p)).rows };
  try { await c.query("BEGIN"); const r = await fn(api); await c.query("COMMIT"); return r; }
  catch (e) { await c.query("ROLLBACK"); throw e; }
  finally { c.release(); }
}
async function nextNum(c, col, prefix, year) {
  const r = await c.run(`UPDATE settings SET ${col}=${col}+1 WHERE id=1 RETURNING ${col}-1 AS n`);
  return `${prefix}-${year}-${String(r.rows[0].n).padStart(4, "0")}`;
}
const uid = () => randomUUID();
const now = () => new Date().toISOString();
const roundH = (lignes, taux, ttc) => { const base = lignes.reduce((a, l) => a + l.prix_unit * (l.qte ?? l.qte_commandee), 0); if (ttc) { const t = base, ht = t / (1 + taux / 100); return { total_ht: ht, tva: t - ht, total_ttc: t }; } const ht = base, tva = ht * taux / 100; return { total_ht: ht, tva, total_ttc: ht + tva }; };
async function paiementsReste(table, invId, ttc) { const r = await get(`SELECT COALESCE(SUM(montant),0) v FROM ${table} WHERE invoice_id=?`, [invId]); const paye = Number(r.v); return { paye, reste: Math.max(0, ttc - paye), statut: paye <= 0.01 ? "non réglée" : ttc - paye <= 0.01 ? "réglée" : "partielle" }; }

/* ---------- App ---------- */
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true }));
app.use(express.json());
// NORMALISEUR : garantit que toutes les routes sont vues avec le préfixe /api
app.use((req, res, next) => { if (!req.url.startsWith("/api")) req.url = "/api" + req.url; next(); });
app.get("/api/health", (req, res) => res.json({ ok: true, service: "DrogueriePro API", build: "v2-index-rewrite", db: !!process.env.DATABASE_URL, time: now() }));
app.get("/", (req, res) => res.json({ ok: true, api: "/api" }));

/* ---------- Auth & permissions ---------- */
const userPerms = async (u) => { const r = await get("SELECT * FROM roles WHERE id=?", [u.role_id]); return r ? JSON.parse(r.permissions || "{}") : {}; };
const canDo = (p, k) => p["*"] === true || p[k] === true;
const audit = (u, a, c) => run("INSERT INTO audit_log (id,user_id,user_nom,action,cible,date) VALUES (?,?,?,?,?,?)", [uid(), u?.id, u?.nom, a, c || null, now()]).catch(() => {});
async function auth(req, res, next) {
  const h = req.headers.authorization || ""; const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Non authentifié" });
  try { const p = jwt.verify(token, JWT_SECRET); const u = await get("SELECT * FROM users WHERE id=? AND actif=1", [p.sub]); if (!u) return res.status(401).json({ error: "Utilisateur inactif" }); req.user = u; req.perms = await userPerms(u); next(); }
  catch { return res.status(401).json({ error: "Session expirée" }); }
}
const need = (k) => (req, res, next) => canDo(req.perms, k) ? next() : res.status(403).json({ error: "Accès refusé", permission: k });
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => { console.error(e); res.status(e.code || 500).json({ error: e.msg || e.message || "Erreur serveur" }); });

/* =====================================================================
 *  AUTH
 * ===================================================================== */
app.post("/api/auth/login", wrap(async (req, res) => {
  const { login, password } = req.body;
  const u = await get("SELECT * FROM users WHERE login=? AND actif=1", [login]);
  if (!u || !bcrypt.compareSync(password, u.password_hash)) return res.status(401).json({ error: "Identifiants incorrects" });
  await run("UPDATE users SET last_login=? WHERE id=?", [now(), u.id]);
  const role = await get("SELECT * FROM roles WHERE id=?", [u.role_id]); audit(u, "auth.login");
  res.json({ token: jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: "12h" }), user: { id: u.id, nom: u.nom, login: u.login, role: role?.nom, code: role?.code }, permissions: JSON.parse(role?.permissions || "{}") });
}));
app.get("/api/auth/me", auth, wrap(async (req, res) => { const role = await get("SELECT * FROM roles WHERE id=?", [req.user.role_id]); res.json({ user: { id: req.user.id, nom: req.user.nom, login: req.user.login, role: role?.nom, code: role?.code }, permissions: req.perms }); }));
app.post("/api/auth/password", auth, wrap(async (req, res) => { const { ancien, nouveau } = req.body; if (!bcrypt.compareSync(ancien, req.user.password_hash)) return res.status(400).json({ error: "Ancien mot de passe incorrect" }); await run("UPDATE users SET password_hash=? WHERE id=?", [bcrypt.hashSync(nouveau, 10), req.user.id]); res.json({ ok: true }); }));

/* =====================================================================
 *  UTILISATEURS & RÔLES
 * ===================================================================== */
app.get("/api/roles", auth, need("users.read"), wrap(async (req, res) => res.json((await all("SELECT * FROM roles")).map((r) => ({ ...r, permissions: JSON.parse(r.permissions) })))));
app.post("/api/roles", auth, need("users.write"), wrap(async (req, res) => { const id = uid(); await run("INSERT INTO roles (id,nom,code,permissions,systeme) VALUES (?,?,?,?,0)", [id, req.body.nom, req.body.code, JSON.stringify(req.body.permissions || {})]); res.json({ id }); }));
app.put("/api/roles/:id", auth, need("users.write"), wrap(async (req, res) => { await run("UPDATE roles SET nom=?, permissions=? WHERE id=?", [req.body.nom, JSON.stringify(req.body.permissions || {}), req.params.id]); res.json({ ok: true }); }));
app.get("/api/users", auth, need("users.read"), wrap(async (req, res) => res.json(await all("SELECT u.id,u.nom,u.login,u.email,u.actif,u.last_login,r.nom role_nom,u.role_id FROM users u LEFT JOIN roles r ON r.id=u.role_id"))));
app.post("/api/users", auth, need("users.write"), wrap(async (req, res) => { const id = uid(); const { nom, login, email, password, role_id } = req.body; await run("INSERT INTO users (id,nom,login,email,password_hash,role_id,actif) VALUES (?,?,?,?,?,?,1)", [id, nom, login, email || null, bcrypt.hashSync(password || "changeme", 10), role_id]); audit(req.user, "user.create", login); res.json({ id }); }));
app.put("/api/users/:id", auth, need("users.write"), wrap(async (req, res) => { const u = await get("SELECT * FROM users WHERE id=?", [req.params.id]); if (!u) return res.status(404).json({ error: "Introuvable" }); const { nom, email, role_id, actif, password } = req.body; await run("UPDATE users SET nom=?, email=?, role_id=?, actif=? WHERE id=?", [nom ?? u.nom, email ?? u.email, role_id ?? u.role_id, actif ?? u.actif, req.params.id]); if (password) await run("UPDATE users SET password_hash=? WHERE id=?", [bcrypt.hashSync(password, 10), req.params.id]); res.json({ ok: true }); }));
app.delete("/api/users/:id", auth, need("users.write"), wrap(async (req, res) => { if (req.params.id === req.user.id) return res.status(400).json({ error: "Auto-suppression interdite" }); await run("DELETE FROM users WHERE id=?", [req.params.id]); res.json({ ok: true }); }));
app.get("/api/audit", auth, need("users.read"), wrap(async (req, res) => res.json(await all("SELECT * FROM audit_log ORDER BY date DESC LIMIT 200"))));

/* =====================================================================
 *  CRUD produits / clients / fournisseurs
 * ===================================================================== */
function crud(path_, table, readP, writeP, fields) {
  app.get(`/api/${path_}`, auth, need(readP), wrap(async (req, res) => res.json(await all(`SELECT * FROM ${table} ORDER BY created_at DESC`))));
  app.post(`/api/${path_}`, auth, need(writeP), wrap(async (req, res) => { const id = req.body.id || uid(); const cols = ["id", ...fields]; const vals = cols.map((c) => c === "id" ? id : (req.body[c] ?? null)); await run(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`, vals); audit(req.user, `${path_}.create`, req.body.nom || id); res.json({ id }); }));
  app.put(`/api/${path_}/:id`, auth, need(writeP), wrap(async (req, res) => { await run(`UPDATE ${table} SET ${fields.map((f) => `${f}=?`).join(",")} WHERE id=?`, [...fields.map((f) => req.body[f] ?? null), req.params.id]); res.json({ ok: true }); }));
  app.delete(`/api/${path_}/:id`, auth, need(writeP), wrap(async (req, res) => { await run(`DELETE FROM ${table} WHERE id=?`, [req.params.id]); res.json({ ok: true }); }));
}
crud("products", "products", "products.read", "products.write", ["ref", "nom", "categorie", "fournisseur_id", "prix_achat", "prix_vente", "quantite", "stock_min", "unite", "date_expiration", "nom_ar"]);
crud("clients", "clients", "clients.read", "clients.write", ["nom", "type", "ice", "tel", "ville", "adresse", "plafond_credit"]);
crud("suppliers", "suppliers", "suppliers.read", "suppliers.write", ["nom", "ice", "tel", "ville", "contact"]);
app.post("/api/products/:id/stock", auth, need("products.write"), wrap(async (req, res) => { const { qte, motif } = req.body; await run("UPDATE products SET quantite=quantite+? WHERE id=?", [qte, req.params.id]); await run("INSERT INTO stock_movements (id,produit_id,type,qte,motif,date) VALUES (?,?,?,?,?,?)", [uid(), req.params.id, "entree", qte, motif || "Entrée rapide", now()]); res.json({ ok: true }); }));
app.get("/api/settings", auth, wrap(async (req, res) => res.json(await get("SELECT * FROM settings WHERE id=1"))));
app.put("/api/settings", auth, need("settings.write"), wrap(async (req, res) => { const s = await get("SELECT * FROM settings WHERE id=1"); const f = ["nom_entreprise", "ice", "rc", "adresse", "ville", "tel", "tva", "lang"]; await run(`UPDATE settings SET ${f.map((k) => `${k}=?`).join(",")} WHERE id=1`, f.map((k) => req.body[k] ?? s[k])); res.json({ ok: true }); }));
app.get("/api/products/peremption", auth, need("products.read"), wrap(async (req, res) => { const j = Number(req.query.jours ?? 90); res.json(await all("SELECT * FROM v_peremption WHERE jours_restants <= ? ORDER BY jours_restants ASC", [j])); }));

/* ---------- Recalc statuts ---------- */
async function recalcPO(c, id) { const ls = await c.all("SELECT * FROM purchase_order_lines WHERE order_id=?", [id]); const recu = ls.every((l) => l.qte_recue >= l.qte_commandee); const fact = ls.every((l) => l.qte_facturee >= l.qte_commandee); const started = ls.some((l) => l.qte_recue > 0 || l.qte_facturee > 0); await c.run("UPDATE purchase_orders SET statut=? WHERE id=?", [recu && fact ? "complet" : started ? "partiel" : "ouvert", id]); }
async function recalcSO(c, id) { const ls = await c.all("SELECT * FROM sales_order_lines WHERE order_id=?", [id]); const liv = ls.every((l) => l.qte_livree >= l.qte_commandee); const fact = ls.every((l) => l.qte_facturee >= l.qte_commandee); const started = ls.some((l) => l.qte_livree > 0 || l.qte_facturee > 0); await c.run("UPDATE sales_orders SET statut=? WHERE id=?", [liv && fact ? "complet" : started ? "partiel" : "ouvert", id]); }

/* =====================================================================
 *  ACHATS
 * ===================================================================== */
async function loadPO(id) { const o = await get("SELECT * FROM purchase_orders WHERE id=?", [id]); if (!o) return null; o.lignes = await all("SELECT *, (qte_commandee-qte_recue) reste_a_recevoir, (qte_commandee-qte_facturee) reste_facturer_cmd, (qte_recue-qte_facturee) reste_facturer_rec FROM purchase_order_lines WHERE order_id=?", [id]); return o; }
app.get("/api/purchase-orders", auth, need("purchases.read"), wrap(async (req, res) => { const os = await all("SELECT id FROM purchase_orders ORDER BY created_at DESC"); res.json(await Promise.all(os.map((o) => loadPO(o.id)))); }));
app.get("/api/purchase-orders/pending", auth, need("purchases.read"), wrap(async (req, res) => { const { fournisseur_id, type, base } = req.query; const rows = await all("SELECT * FROM v_achat_restes WHERE fournisseur_id=?", [fournisseur_id]); res.json(rows.map((r) => ({ ...r, reste: type === "reception" ? r.reste_a_recevoir : base === "commande" ? r.reste_facturer_cmd : r.reste_facturer_rec })).filter((r) => r.reste > 0.0001)); }));
app.post("/api/purchase-orders", auth, need("purchases.write"), wrap(async (req, res) => {
  const { date, fournisseur_id, taux_tva, lignes } = req.body; const f = await get("SELECT * FROM suppliers WHERE id=?", [fournisseur_id]);
  const t = roundH(lignes.map((l) => ({ ...l, qte: l.qte })), taux_tva, false); const id = uid(); const year = (date || now()).slice(0, 4);
  await tx(async (c) => { const num = await nextNum(c, "c_cf", "CF", year); await c.run("INSERT INTO purchase_orders (id,date,fournisseur_id,fournisseur_nom,fournisseur_ice,num_commande,taux_tva,total_ht,tva,total_ttc,statut) VALUES (?,?,?,?,?,?,?,?,?,?,'ouvert')", [id, date, fournisseur_id, f?.nom, f?.ice, num, taux_tva, t.total_ht, t.tva, t.total_ttc]); for (const l of lignes) await c.run("INSERT INTO purchase_order_lines (id,order_id,produit_id,ref,nom,prix_unit,qte_commandee,qte_recue,qte_facturee) VALUES (?,?,?,?,?,?,?,0,0)", [uid(), id, l.produit_id, l.ref, l.nom, l.prix_unit, l.qte]); });
  audit(req.user, "po.create", id); res.json(await loadPO(id));
}));
app.delete("/api/purchase-orders/:id", auth, need("purchases.delete"), wrap(async (req, res) => { const o = await loadPO(req.params.id); if (!o) return res.status(404).json({ error: "Introuvable" }); if (o.lignes.some((l) => l.qte_recue > 0 || l.qte_facturee > 0)) return res.status(400).json({ error: "Commande déjà traitée : supprimez réceptions/factures d'abord." }); await run("DELETE FROM purchase_orders WHERE id=?", [req.params.id]); res.json({ ok: true }); }));

async function loadReception(id) { const r = await get("SELECT * FROM receptions WHERE id=?", [id]); if (!r) return null; r.lignes = await all("SELECT * FROM reception_lines WHERE reception_id=?", [id]); return r; }
app.get("/api/receptions", auth, need("purchases.read"), wrap(async (req, res) => { const rs = await all("SELECT id FROM receptions ORDER BY created_at DESC"); res.json(await Promise.all(rs.map((r) => loadReception(r.id)))); }));
app.post("/api/receptions", auth, need("purchases.write"), wrap(async (req, res) => {
  const { date, fournisseur_id, note, lignes } = req.body; if (!lignes?.length) return res.status(400).json({ error: "Aucune ligne" });
  const alerts = []; const id = uid(); const year = (date || now()).slice(0, 4); const f = await get("SELECT * FROM suppliers WHERE id=?", [fournisseur_id]);
  await tx(async (c) => {
    const num = await nextNum(c, "c_br", "BR", year); let totalHT = 0;
    await c.run("INSERT INTO receptions (id,date,fournisseur_id,fournisseur_nom,num_reception,note,total_ht) VALUES (?,?,?,?,?,?,0)", [id, date, fournisseur_id, f?.nom, num, note || null]);
    const orders = new Set();
    for (const li of lignes) { const ol = await c.get("SELECT ol.*, po.fournisseur_id fid FROM purchase_order_lines ol JOIN purchase_orders po ON po.id=ol.order_id WHERE ol.id=?", [li.order_line_id]);
      if (!ol) throw { code: 400, msg: "Ligne introuvable" }; if (ol.fid !== fournisseur_id) throw { code: 400, msg: "Fournisseur différent" };
      const qte = Number(li.qte); if (qte <= 0) continue; const prix = li.prix_unit != null ? Number(li.prix_unit) : ol.prix_unit;
      if (ol.qte_recue + qte > ol.qte_commandee + 0.0001) alerts.push(`Sur-réception « ${ol.nom} » : ${ol.qte_recue + qte}/${ol.qte_commandee}.`);
      await c.run("INSERT INTO reception_lines (id,reception_id,order_line_id,order_id,produit_id,nom,prix_unit,qte) VALUES (?,?,?,?,?,?,?,?)", [uid(), id, ol.id, ol.order_id, ol.produit_id, ol.nom, prix, qte]);
      await c.run("UPDATE purchase_order_lines SET qte_recue=qte_recue+? WHERE id=?", [qte, ol.id]);
      await c.run("UPDATE products SET quantite=quantite+?, prix_achat=? WHERE id=?", [qte, prix, ol.produit_id]);
      await c.run("INSERT INTO stock_movements (id,produit_id,type,qte,motif,date) VALUES (?,?,?,?,?,?)", [uid(), ol.produit_id, "entree", qte, num, now()]); totalHT += prix * qte; orders.add(ol.order_id); }
    await c.run("UPDATE receptions SET total_ht=? WHERE id=?", [totalHT, id]);
    for (const o of orders) await recalcPO(c, o);
  });
  audit(req.user, "reception.create", id); res.json({ reception: await loadReception(id), alerts });
}));
app.delete("/api/receptions/:id", auth, need("purchases.delete"), wrap(async (req, res) => { const r = await loadReception(req.params.id); if (!r) return res.status(404).json({ error: "Introuvable" }); await tx(async (c) => { const orders = new Set(); for (const l of r.lignes) { await c.run("UPDATE purchase_order_lines SET qte_recue=GREATEST(0,qte_recue-?) WHERE id=?", [l.qte, l.order_line_id]); await c.run("UPDATE products SET quantite=GREATEST(0,quantite-?) WHERE id=?", [l.qte, l.produit_id]); orders.add(l.order_id); } await c.run("DELETE FROM receptions WHERE id=?", [req.params.id]); for (const o of orders) await recalcPO(c, o); }); res.json({ ok: true }); }));

async function loadSI(id) { const s = await get("SELECT * FROM supplier_invoices WHERE id=?", [id]); if (!s) return null; s.lignes = await all("SELECT * FROM supplier_invoice_lines WHERE invoice_id=?", [id]); s.paiements = await all("SELECT * FROM purchase_payments WHERE invoice_id=? ORDER BY date", [id]); s.reglement = await paiementsReste("purchase_payments", id, Number(s.total_ttc)); return s; }
app.get("/api/supplier-invoices", auth, need("purchases.read"), wrap(async (req, res) => { const rs = await all("SELECT id FROM supplier_invoices ORDER BY created_at DESC"); res.json(await Promise.all(rs.map((r) => loadSI(r.id)))); }));
app.post("/api/supplier-invoices", auth, need("purchases.write"), wrap(async (req, res) => {
  const { date, fournisseur_id, base, taux_tva, lignes } = req.body; if (!lignes?.length) return res.status(400).json({ error: "Aucune ligne" });
  const alerts = []; const id = uid(); const year = (date || now()).slice(0, 4); const f = await get("SELECT * FROM suppliers WHERE id=?", [fournisseur_id]);
  await tx(async (c) => {
    const num = await nextNum(c, "c_ff", "FF", year); const orders = new Set();
    for (const li of lignes) { const ol = await c.get("SELECT ol.*, po.fournisseur_id fid FROM purchase_order_lines ol JOIN purchase_orders po ON po.id=ol.order_id WHERE ol.id=?", [li.order_line_id]);
      if (!ol) throw { code: 400, msg: "Ligne introuvable" }; if (ol.fid !== fournisseur_id) throw { code: 400, msg: "Fournisseur différent" };
      const qte = Number(li.qte); if (qte <= 0) continue; const dispo = base === "commande" ? ol.qte_commandee - ol.qte_facturee : ol.qte_recue - ol.qte_facturee;
      if (qte > dispo + 0.0001) alerts.push(`Facturation « ${ol.nom} » : ${qte} demandés, ${dispo} facturables.`);
      const prix = li.prix_unit != null ? Number(li.prix_unit) : ol.prix_unit;
      await c.run("INSERT INTO supplier_invoice_lines (id,invoice_id,order_line_id,order_id,produit_id,nom,prix_unit,qte) VALUES (?,?,?,?,?,?,?,?)", [uid(), id, ol.id, ol.order_id, ol.produit_id, ol.nom, prix, qte]);
      await c.run("UPDATE purchase_order_lines SET qte_facturee=qte_facturee+? WHERE id=?", [qte, ol.id]); orders.add(ol.order_id); }
    const inv = await c.all("SELECT prix_unit, qte FROM supplier_invoice_lines WHERE invoice_id=?", [id]); const t = roundH(inv, taux_tva, false);
    await c.run("INSERT INTO supplier_invoices (id,date,fournisseur_id,fournisseur_nom,fournisseur_ice,num_facture,base,taux_tva,total_ht,tva,total_ttc) VALUES (?,?,?,?,?,?,?,?,?,?,?)", [id, date, fournisseur_id, f?.nom, f?.ice, num, base, taux_tva, t.total_ht, t.tva, t.total_ttc]);
    for (const o of orders) await recalcPO(c, o);
  });
  audit(req.user, "supplier_invoice.create", id); res.json({ invoice: await loadSI(id), alerts });
}));
app.post("/api/supplier-invoices/:id/pay", auth, need("purchases.pay"), wrap(async (req, res) => { const { montant, mode, date, note } = req.body; await run("INSERT INTO purchase_payments (id,invoice_id,date,montant,mode,note) VALUES (?,?,?,?,?,?)", [uid(), req.params.id, date || now().slice(0, 10), montant, mode, note || null]); res.json(await loadSI(req.params.id)); }));
app.delete("/api/supplier-invoices/:id/pay/:payId", auth, need("purchases.pay"), wrap(async (req, res) => { await run("DELETE FROM purchase_payments WHERE id=? AND invoice_id=?", [req.params.payId, req.params.id]); audit(req.user, "supplier_payment.cancel", req.params.payId); res.json(await loadSI(req.params.id)); }));
app.delete("/api/supplier-invoices/:id", auth, need("purchases.delete"), wrap(async (req, res) => { const s = await loadSI(req.params.id); if (!s) return res.status(404).json({ error: "Introuvable" }); await tx(async (c) => { const orders = new Set(); for (const l of s.lignes) { await c.run("UPDATE purchase_order_lines SET qte_facturee=GREATEST(0,qte_facturee-?) WHERE id=?", [l.qte, l.order_line_id]); orders.add(l.order_id); } await c.run("DELETE FROM supplier_invoices WHERE id=?", [req.params.id]); for (const o of orders) await recalcPO(c, o); }); res.json({ ok: true }); }));

/* =====================================================================
 *  VENTES
 * ===================================================================== */
async function loadSO(id) { const o = await get("SELECT * FROM sales_orders WHERE id=?", [id]); if (!o) return null; o.lignes = await all("SELECT *, (qte_commandee-qte_livree) reste_a_livrer, (qte_commandee-qte_facturee) reste_facturer_cmd, (qte_livree-qte_facturee) reste_facturer_liv FROM sales_order_lines WHERE order_id=?", [id]); return o; }
app.get("/api/sales-orders", auth, need("sales.read"), wrap(async (req, res) => { const os = await all("SELECT id FROM sales_orders ORDER BY created_at DESC"); res.json(await Promise.all(os.map((o) => loadSO(o.id)))); }));
app.get("/api/sales-orders/pending", auth, need("sales.read"), wrap(async (req, res) => { const { client_id, type, base } = req.query; const rows = await all("SELECT * FROM v_vente_restes WHERE client_id=?", [client_id]); res.json(rows.map((r) => ({ ...r, reste: type === "livraison" ? r.reste_a_livrer : base === "commande" ? r.reste_facturer_cmd : r.reste_facturer_liv })).filter((r) => r.reste > 0.0001)); }));
app.post("/api/sales-orders", auth, need("sales.write"), wrap(async (req, res) => {
  const { date, client_id, taux_tva, lignes, stage = "commande" } = req.body; const cl = await get("SELECT * FROM clients WHERE id=?", [client_id]);
  const t = roundH(lignes.map((l) => ({ ...l, qte: l.qte })), taux_tva, true); const id = uid(); const year = (date || now()).slice(0, 4);
  await tx(async (c) => { const num = stage === "devis" ? await nextNum(c, "c_devis", "DEV", year) : await nextNum(c, "c_commande", "BC", year); await c.run(`INSERT INTO sales_orders (id,date,client_id,client_nom,client_ice,${stage === "devis" ? "num_devis" : "num_commande"},stage,taux_tva,total_ht,tva,total_ttc,statut) VALUES (?,?,?,?,?,?,?,?,?,?,?,'ouvert')`, [id, date, client_id, cl?.nom, cl?.ice, num, stage, taux_tva, t.total_ht, t.tva, t.total_ttc]); for (const l of lignes) await c.run("INSERT INTO sales_order_lines (id,order_id,produit_id,ref,nom,prix_unit,qte_commandee,qte_livree,qte_facturee) VALUES (?,?,?,?,?,?,?,0,0)", [uid(), id, l.produit_id, l.ref, l.nom, l.prix_unit, l.qte]); });
  audit(req.user, "so.create", id); res.json(await loadSO(id));
}));
app.post("/api/sales-orders/:id/confirm", auth, need("sales.write"), wrap(async (req, res) => { const o = await get("SELECT * FROM sales_orders WHERE id=?", [req.params.id]); if (!o || o.stage !== "devis") return res.status(400).json({ error: "Devis introuvable" }); await tx(async (c) => { const num = await nextNum(c, "c_commande", "BC", String(o.date).slice(0, 4)); await c.run("UPDATE sales_orders SET stage='commande', num_commande=? WHERE id=?", [num, o.id]); }); res.json(await loadSO(o.id)); }));
app.delete("/api/sales-orders/:id", auth, need("sales.delete"), wrap(async (req, res) => { const o = await loadSO(req.params.id); if (o.lignes.some((l) => l.qte_livree > 0 || l.qte_facturee > 0)) return res.status(400).json({ error: "Commande déjà traitée : supprimez BL/factures d'abord." }); await run("DELETE FROM sales_orders WHERE id=?", [req.params.id]); res.json({ ok: true }); }));

async function loadDelivery(id) { const d = await get("SELECT * FROM deliveries WHERE id=?", [id]); if (!d) return null; d.lignes = await all("SELECT * FROM delivery_lines WHERE delivery_id=?", [id]); return d; }
app.get("/api/deliveries", auth, need("sales.read"), wrap(async (req, res) => { const ds = await all("SELECT id FROM deliveries ORDER BY created_at DESC"); res.json(await Promise.all(ds.map((d) => loadDelivery(d.id)))); }));
app.post("/api/deliveries", auth, need("sales.write"), wrap(async (req, res) => {
  const { date, client_id, note, lignes, trip_id } = req.body; if (!lignes?.length) return res.status(400).json({ error: "Aucune ligne" });
  const alerts = []; const id = uid(); const year = (date || now()).slice(0, 4); const cl = await get("SELECT * FROM clients WHERE id=?", [client_id]);
  await tx(async (c) => {
    const num = await nextNum(c, "c_bl", "BL", year); let totalHT = 0; const orders = new Set();
    await c.run("INSERT INTO deliveries (id,date,client_id,client_nom,num_bl,note,trip_id,total_ht) VALUES (?,?,?,?,?,?,?,0)", [id, date, client_id, cl?.nom, num, note || null, trip_id || null]);
    for (const li of lignes) { const ol = await c.get("SELECT ol.*, so.client_id cid FROM sales_order_lines ol JOIN sales_orders so ON so.id=ol.order_id WHERE ol.id=?", [li.order_line_id]);
      if (!ol) throw { code: 400, msg: "Ligne introuvable" }; if (ol.cid !== client_id) throw { code: 400, msg: "Client différent" };
      const qte = Number(li.qte); if (qte <= 0) continue; const prod = await c.get("SELECT * FROM products WHERE id=?", [ol.produit_id]);
      if (prod && qte > prod.quantite + 0.0001) throw { code: 400, msg: `Stock insuffisant « ${ol.nom} » (dispo ${prod.quantite}).` };
      if (ol.qte_livree + qte > ol.qte_commandee + 0.0001) alerts.push(`Sur-livraison « ${ol.nom} » : ${ol.qte_livree + qte}/${ol.qte_commandee}.`);
      await c.run("INSERT INTO delivery_lines (id,delivery_id,order_line_id,order_id,produit_id,nom,prix_unit,qte) VALUES (?,?,?,?,?,?,?,?)", [uid(), id, ol.id, ol.order_id, ol.produit_id, ol.nom, ol.prix_unit, qte]);
      await c.run("UPDATE sales_order_lines SET qte_livree=qte_livree+? WHERE id=?", [qte, ol.id]);
      await c.run("UPDATE products SET quantite=quantite-? WHERE id=?", [qte, ol.produit_id]);
      await c.run("INSERT INTO stock_movements (id,produit_id,type,qte,motif,date) VALUES (?,?,?,?,?,?)", [uid(), ol.produit_id, "sortie", qte, num, now()]); totalHT += ol.prix_unit * qte; orders.add(ol.order_id); }
    await c.run("UPDATE deliveries SET total_ht=? WHERE id=?", [totalHT, id]); for (const o of orders) await recalcSO(c, o);
  });
  audit(req.user, "delivery.create", id); res.json({ delivery: await loadDelivery(id), alerts });
}));
app.delete("/api/deliveries/:id", auth, need("sales.delete"), wrap(async (req, res) => { const d = await loadDelivery(req.params.id); if (!d) return res.status(404).json({ error: "Introuvable" }); await tx(async (c) => { const orders = new Set(); for (const l of d.lignes) { await c.run("UPDATE sales_order_lines SET qte_livree=GREATEST(0,qte_livree-?) WHERE id=?", [l.qte, l.order_line_id]); await c.run("UPDATE products SET quantite=quantite+? WHERE id=?", [l.qte, l.produit_id]); orders.add(l.order_id); } await c.run("DELETE FROM deliveries WHERE id=?", [req.params.id]); for (const o of orders) await recalcSO(c, o); }); res.json({ ok: true }); }));

async function loadCI(id) { const s = await get("SELECT * FROM customer_invoices WHERE id=?", [id]); if (!s) return null; s.lignes = await all("SELECT * FROM customer_invoice_lines WHERE invoice_id=?", [id]); s.paiements = await all("SELECT * FROM sale_payments WHERE invoice_id=? ORDER BY date", [id]); s.reglement = await paiementsReste("sale_payments", id, Number(s.total_ttc)); return s; }
app.get("/api/customer-invoices", auth, need("sales.read"), wrap(async (req, res) => { const rs = await all("SELECT id FROM customer_invoices ORDER BY created_at DESC"); res.json(await Promise.all(rs.map((r) => loadCI(r.id)))); }));
app.post("/api/customer-invoices", auth, need("sales.write"), wrap(async (req, res) => {
  const { date, client_id, base, taux_tva, lignes, trip_id } = req.body; if (!lignes?.length) return res.status(400).json({ error: "Aucune ligne" });
  const alerts = []; const id = uid(); const year = (date || now()).slice(0, 4); const cl = await get("SELECT * FROM clients WHERE id=?", [client_id]);
  await tx(async (c) => {
    const num = await nextNum(c, "c_facture", "FAC", year); const orders = new Set();
    for (const li of lignes) { const ol = await c.get("SELECT ol.*, so.client_id cid FROM sales_order_lines ol JOIN sales_orders so ON so.id=ol.order_id WHERE ol.id=?", [li.order_line_id]);
      if (!ol) throw { code: 400, msg: "Ligne introuvable" }; if (ol.cid !== client_id) throw { code: 400, msg: "Client différent" };
      const qte = Number(li.qte); if (qte <= 0) continue; const dispo = base === "commande" ? ol.qte_commandee - ol.qte_facturee : ol.qte_livree - ol.qte_facturee;
      if (qte > dispo + 0.0001) alerts.push(`Facturation « ${ol.nom} » : ${qte} demandés, ${dispo} facturables.`);
      const prod = await c.get("SELECT prix_achat FROM products WHERE id=?", [ol.produit_id]);
      await c.run("INSERT INTO customer_invoice_lines (id,invoice_id,order_line_id,order_id,produit_id,nom,prix_unit,cout_unit,qte) VALUES (?,?,?,?,?,?,?,?,?)", [uid(), id, ol.id, ol.order_id, ol.produit_id, ol.nom, ol.prix_unit, prod?.prix_achat || 0, qte]);
      await c.run("UPDATE sales_order_lines SET qte_facturee=qte_facturee+? WHERE id=?", [qte, ol.id]); orders.add(ol.order_id); }
    const inv = await c.all("SELECT prix_unit, qte FROM customer_invoice_lines WHERE invoice_id=?", [id]); const t = roundH(inv, taux_tva, true);
    await c.run("INSERT INTO customer_invoices (id,date,client_id,client_nom,client_ice,num_facture,base,taux_tva,trip_id,total_ht,tva,total_ttc) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", [id, date, client_id, cl?.nom, cl?.ice, num, base, taux_tva, trip_id || null, t.total_ht, t.tva, t.total_ttc]);
    for (const o of orders) await recalcSO(c, o);
  });
  audit(req.user, "customer_invoice.create", id); res.json({ invoice: await loadCI(id), alerts });
}));
app.post("/api/customer-invoices/:id/pay", auth, need("sales.pay"), wrap(async (req, res) => { const { montant, mode, date, note } = req.body; await run("INSERT INTO sale_payments (id,invoice_id,date,montant,mode,note) VALUES (?,?,?,?,?,?)", [uid(), req.params.id, date || now().slice(0, 10), montant, mode, note || null]); res.json(await loadCI(req.params.id)); }));
app.delete("/api/customer-invoices/:id/pay/:payId", auth, need("sales.pay"), wrap(async (req, res) => { await run("DELETE FROM sale_payments WHERE id=? AND invoice_id=?", [req.params.payId, req.params.id]); audit(req.user, "sale_payment.cancel", req.params.payId); res.json(await loadCI(req.params.id)); }));
app.delete("/api/customer-invoices/:id", auth, need("sales.delete"), wrap(async (req, res) => { const s = await loadCI(req.params.id); if (!s) return res.status(404).json({ error: "Introuvable" }); await tx(async (c) => { const orders = new Set(); for (const l of s.lignes) { await c.run("UPDATE sales_order_lines SET qte_facturee=GREATEST(0,qte_facturee-?) WHERE id=?", [l.qte, l.order_line_id]); orders.add(l.order_id); } await c.run("DELETE FROM customer_invoices WHERE id=?", [req.params.id]); for (const o of orders) await recalcSO(c, o); }); res.json({ ok: true }); }));

app.post("/api/sales/direct", auth, need("sales.write"), wrap(async (req, res) => {
  const { date, client_id, taux_tva, lignes, trip_id } = req.body; const cl = await get("SELECT * FROM clients WHERE id=?", [client_id]); const year = (date || now()).slice(0, 4);
  const result = await tx(async (c) => {
    const t = roundH(lignes.map((l) => ({ ...l, qte: l.qte })), taux_tva, true); const oid = uid(); const numBC = await nextNum(c, "c_commande", "BC", year);
    await c.run("INSERT INTO sales_orders (id,date,client_id,client_nom,client_ice,num_commande,stage,taux_tva,total_ht,tva,total_ttc,statut) VALUES (?,?,?,?,?,?,'commande',?,?,?,?,'complet')", [oid, date, client_id, cl?.nom, cl?.ice, numBC, taux_tva, t.total_ht, t.tva, t.total_ttc]);
    const ols = []; for (const l of lignes) { const olid = uid(); ols.push({ id: olid, l }); await c.run("INSERT INTO sales_order_lines (id,order_id,produit_id,ref,nom,prix_unit,qte_commandee,qte_livree,qte_facturee) VALUES (?,?,?,?,?,?,?,?,?)", [olid, oid, l.produit_id, l.ref, l.nom, l.prix_unit, l.qte, l.qte, l.qte]); }
    const did = uid(); const numBL = await nextNum(c, "c_bl", "BL", year);
    await c.run("INSERT INTO deliveries (id,date,client_id,client_nom,num_bl,trip_id,total_ht) VALUES (?,?,?,?,?,?,?)", [did, date, client_id, cl?.nom, numBL, trip_id || null, t.total_ht]);
    for (const { id: olid, l } of ols) { const prod = await c.get("SELECT * FROM products WHERE id=?", [l.produit_id]); if (prod && l.qte > prod.quantite + 0.0001) throw { code: 400, msg: `Stock insuffisant « ${l.nom} » (dispo ${prod.quantite}).` };
      await c.run("INSERT INTO delivery_lines (id,delivery_id,order_line_id,order_id,produit_id,nom,prix_unit,qte) VALUES (?,?,?,?,?,?,?,?)", [uid(), did, olid, oid, l.produit_id, l.nom, l.prix_unit, l.qte]);
      await c.run("UPDATE products SET quantite=quantite-? WHERE id=?", [l.qte, l.produit_id]);
      await c.run("INSERT INTO stock_movements (id,produit_id,type,qte,motif,date) VALUES (?,?,?,?,?,?)", [uid(), l.produit_id, "sortie", l.qte, numBL, now()]); }
    const fid = uid(); const numFAC = await nextNum(c, "c_facture", "FAC", year);
    await c.run("INSERT INTO customer_invoices (id,date,client_id,client_nom,client_ice,num_facture,base,taux_tva,trip_id,total_ht,tva,total_ttc) VALUES (?,?,?,?,?,?,'livraison',?,?,?,?,?)", [fid, date, client_id, cl?.nom, cl?.ice, numFAC, taux_tva, trip_id || null, t.total_ht, t.tva, t.total_ttc]);
    for (const { id: olid, l } of ols) { const prod = await c.get("SELECT prix_achat FROM products WHERE id=?", [l.produit_id]); await c.run("INSERT INTO customer_invoice_lines (id,invoice_id,order_line_id,order_id,produit_id,nom,prix_unit,cout_unit,qte) VALUES (?,?,?,?,?,?,?,?,?)", [uid(), fid, olid, oid, l.produit_id, l.nom, l.prix_unit, prod?.prix_achat || 0, l.qte]); }
    return { order: numBC, bl: numBL, facture: numFAC, invoiceId: fid };
  });
  audit(req.user, "sale.direct", result.facture); res.json(result);
}));

/* =====================================================================
 *  FINANCE : créances / dettes + relevés
 * ===================================================================== */
app.get("/api/finance/clients", auth, need("finance.read"), wrap(async (req, res) => res.json(await all("SELECT * FROM v_situation_clients ORDER BY solde_du DESC"))));
app.get("/api/finance/suppliers", auth, need("finance.read"), wrap(async (req, res) => res.json(await all("SELECT * FROM v_situation_fournisseurs ORDER BY solde_du DESC"))));
app.get("/api/finance/clients/:id", auth, need("finance.read"), wrap(async (req, res) => {
  const c = await get("SELECT * FROM clients WHERE id=?", [req.params.id]); if (!c) return res.status(404).json({ error: "Client introuvable" });
  const factures = await all("SELECT ci.*, (ci.total_ttc - COALESCE((SELECT SUM(montant) FROM sale_payments WHERE invoice_id=ci.id),0)) reste FROM customer_invoices ci WHERE client_id=? ORDER BY date", [req.params.id]);
  const paiements = await all("SELECT sp.* FROM sale_payments sp JOIN customer_invoices ci ON ci.id=sp.invoice_id WHERE ci.client_id=? ORDER BY sp.date", [req.params.id]);
  const mvts = [...factures.map((f) => ({ date: f.date, piece: f.num_facture, libelle: "Facture", debit: Number(f.total_ttc), credit: 0 })), ...paiements.map((p) => ({ date: p.date, piece: p.mode, libelle: "Règlement " + (p.mode || ""), debit: 0, credit: Number(p.montant) }))].sort((a, b) => (a.date < b.date ? -1 : 1));
  let solde = 0; mvts.forEach((m) => { solde += m.debit - m.credit; m.solde = solde; });
  const tf = factures.reduce((a, f) => a + Number(f.total_ttc), 0), tr = paiements.reduce((a, p) => a + Number(p.montant), 0);
  res.json({ client: c, factures, paiements, mouvements: mvts, total_facture: tf, total_regle: tr, solde_du: tf - tr });
}));
app.get("/api/finance/suppliers/:id", auth, need("finance.read"), wrap(async (req, res) => {
  const s = await get("SELECT * FROM suppliers WHERE id=?", [req.params.id]); if (!s) return res.status(404).json({ error: "Fournisseur introuvable" });
  const factures = await all("SELECT si.*, (si.total_ttc - COALESCE((SELECT SUM(montant) FROM purchase_payments WHERE invoice_id=si.id),0)) reste FROM supplier_invoices si WHERE fournisseur_id=? ORDER BY date", [req.params.id]);
  const paiements = await all("SELECT pp.* FROM purchase_payments pp JOIN supplier_invoices si ON si.id=pp.invoice_id WHERE si.fournisseur_id=? ORDER BY pp.date", [req.params.id]);
  const mvts = [...factures.map((f) => ({ date: f.date, piece: f.num_facture, libelle: "Facture", debit: Number(f.total_ttc), credit: 0 })), ...paiements.map((p) => ({ date: p.date, piece: p.mode, libelle: "Règlement " + (p.mode || ""), debit: 0, credit: Number(p.montant) }))].sort((a, b) => (a.date < b.date ? -1 : 1));
  let solde = 0; mvts.forEach((m) => { solde += m.debit - m.credit; m.solde = solde; });
  const tf = factures.reduce((a, f) => a + Number(f.total_ttc), 0), tr = paiements.reduce((a, p) => a + Number(p.montant), 0);
  res.json({ fournisseur: s, factures, paiements, mouvements: mvts, total_facture: tf, total_regle: tr, solde_du: tf - tr });
}));

/* =====================================================================
 *  PIÈCES JOINTES (stockées en base : bytea)
 * ===================================================================== */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
app.post("/api/attachments/:entityType/:entityId", auth, upload.single("file"), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Aucun fichier" });
  const id = uid();
  await run("INSERT INTO attachments (id,entity_type,entity_id,filename,original_name,mime,size,uploaded_by,data) VALUES (?,?,?,?,?,?,?,?,?)", [id, req.params.entityType, req.params.entityId, req.file.originalname, req.file.originalname, req.file.mimetype, req.file.size, req.user.nom, req.file.buffer]);
  audit(req.user, "attachment.add", `${req.params.entityType}:${req.params.entityId}`);
  res.json(await get("SELECT id,entity_type,entity_id,original_name,mime,size,uploaded_by,created_at FROM attachments WHERE id=?", [id]));
}));
app.get("/api/attachments/:entityType/:entityId", auth, wrap(async (req, res) => res.json(await all("SELECT id,entity_type,entity_id,original_name,mime,size,uploaded_by,created_at FROM attachments WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC", [req.params.entityType, req.params.entityId]))));
app.get("/api/attachments/file/:id", auth, wrap(async (req, res) => { const a = await get("SELECT * FROM attachments WHERE id=?", [req.params.id]); if (!a) return res.status(404).json({ error: "Introuvable" }); res.setHeader("Content-Type", a.mime || "application/octet-stream"); res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(a.original_name || "fichier")}"`); res.send(a.data); }));
app.delete("/api/attachments/:id", auth, wrap(async (req, res) => { await run("DELETE FROM attachments WHERE id=?", [req.params.id]); res.json({ ok: true }); }));

/* =====================================================================
 *  CHARGES & DÉPLACEMENTS
 * ===================================================================== */
const CATEGORIES_CHARGE = ["Transport", "Carburant", "Nourriture", "Personnel", "Péage", "Hébergement", "Autre"];
app.get("/api/expense-categories", auth, (req, res) => res.json(CATEGORIES_CHARGE));
app.get("/api/trips", auth, need("expenses.read"), wrap(async (req, res) => res.json(await all("SELECT * FROM trips ORDER BY date DESC"))));
app.post("/api/trips", auth, need("expenses.write"), wrap(async (req, res) => { const { date, libelle, destination, responsable, vehicule, note } = req.body; const id = uid(); const num = await tx(async (c) => nextNum(c, "c_dep", "DEP", (date || now()).slice(0, 4))); await run("INSERT INTO trips (id,num_dep,date,libelle,destination,responsable,vehicule,note,statut) VALUES (?,?,?,?,?,?,?,?,'ouvert')", [id, num, date, libelle, destination || null, responsable || null, vehicule || null, note || null]); audit(req.user, "trip.create", num); res.json(await get("SELECT * FROM trips WHERE id=?", [id])); }));
app.put("/api/trips/:id", auth, need("expenses.write"), wrap(async (req, res) => { const f = ["date", "libelle", "destination", "responsable", "vehicule", "note", "statut"]; const cur = await get("SELECT * FROM trips WHERE id=?", [req.params.id]); await run(`UPDATE trips SET ${f.map((k) => `${k}=?`).join(",")} WHERE id=?`, [...f.map((k) => req.body[k] ?? cur[k]), req.params.id]); res.json({ ok: true }); }));
app.delete("/api/trips/:id", auth, need("expenses.write"), wrap(async (req, res) => { await run("UPDATE expenses SET trip_id=NULL WHERE trip_id=?", [req.params.id]); await run("UPDATE customer_invoices SET trip_id=NULL WHERE trip_id=?", [req.params.id]); await run("DELETE FROM trips WHERE id=?", [req.params.id]); res.json({ ok: true }); }));
app.get("/api/expenses", auth, need("expenses.read"), wrap(async (req, res) => { const { trip_id } = req.query; res.json(trip_id ? await all("SELECT * FROM expenses WHERE trip_id=? ORDER BY date DESC", [trip_id]) : await all("SELECT * FROM expenses ORDER BY date DESC")); }));
app.post("/api/expenses", auth, need("expenses.write"), wrap(async (req, res) => { const { date, categorie, libelle, montant, trip_id, beneficiaire, mode } = req.body; const id = uid(); const num = await tx(async (c) => nextNum(c, "c_chg", "CHG", (date || now()).slice(0, 4))); await run("INSERT INTO expenses (id,num_chg,date,categorie,libelle,montant,trip_id,beneficiaire,mode) VALUES (?,?,?,?,?,?,?,?,?)", [id, num, date, categorie, libelle || null, montant, trip_id || null, beneficiaire || null, mode || null]); audit(req.user, "expense.create", num); res.json(await get("SELECT * FROM expenses WHERE id=?", [id])); }));
app.put("/api/expenses/:id", auth, need("expenses.write"), wrap(async (req, res) => { const f = ["date", "categorie", "libelle", "montant", "trip_id", "beneficiaire", "mode"]; const cur = await get("SELECT * FROM expenses WHERE id=?", [req.params.id]); await run(`UPDATE expenses SET ${f.map((k) => `${k}=?`).join(",")} WHERE id=?`, [...f.map((k) => req.body[k] ?? cur[k]), req.params.id]); res.json({ ok: true }); }));
app.delete("/api/expenses/:id", auth, need("expenses.write"), wrap(async (req, res) => { await run("DELETE FROM expenses WHERE id=?", [req.params.id]); res.json({ ok: true }); }));
app.get("/api/trips/:id/margin", auth, need("expenses.read"), wrap(async (req, res) => {
  const trip = await get("SELECT * FROM trips WHERE id=?", [req.params.id]); if (!trip) return res.status(404).json({ error: "Déplacement introuvable" });
  const factures = await all("SELECT * FROM customer_invoices WHERE trip_id=?", [req.params.id]);
  const ca_ttc = factures.reduce((a, f) => a + Number(f.total_ttc), 0), ca_ht = factures.reduce((a, f) => a + Number(f.total_ht), 0);
  let cout_achat = 0, marge_brute = 0;
  for (const f of factures) { const ls = await all("SELECT * FROM customer_invoice_lines WHERE invoice_id=?", [f.id]); for (const l of ls) { cout_achat += (Number(l.cout_unit) || 0) * Number(l.qte); marge_brute += (Number(l.prix_unit) / (1 + Number(f.taux_tva) / 100) - (Number(l.cout_unit) || 0)) * Number(l.qte); } }
  const charges = Number((await get("SELECT COALESCE(SUM(montant),0) v FROM expenses WHERE trip_id=?", [req.params.id])).v);
  const detailCharges = await all("SELECT categorie, SUM(montant) total FROM expenses WHERE trip_id=? GROUP BY categorie", [req.params.id]);
  const marge_nette = marge_brute - charges;
  res.json({ trip, nb_factures: factures.length, ca_ttc, ca_ht, cout_achat, marge_brute, total_charges: charges, detail_charges: detailCharges, marge_nette, taux_marge: ca_ht ? (marge_nette / ca_ht) * 100 : 0 });
}));

/* =====================================================================
 *  Tableau de bord
 * ===================================================================== */
app.get("/api/dashboard", auth, need("dashboard.read"), wrap(async (req, res) => {
  const month = now().slice(0, 7);
  const caMonth = Number((await get("SELECT COALESCE(SUM(total_ttc),0) v FROM customer_invoices WHERE to_char(date,'YYYY-MM')=?", [month])).v);
  const caToday = Number((await get("SELECT COALESCE(SUM(total_ttc),0) v FROM customer_invoices WHERE date=CURRENT_DATE")).v);
  const stockValue = Number((await get("SELECT COALESCE(SUM(quantite*prix_achat),0) v FROM products")).v);
  const creances = Number((await get("SELECT COALESCE(SUM(reste),0) v FROM v_creances")).v);
  const dettes = Number((await get("SELECT COALESCE(SUM(reste),0) v FROM v_dettes")).v);
  const chargesMonth = Number((await get("SELECT COALESCE(SUM(montant),0) v FROM expenses WHERE to_char(date,'YYYY-MM')=?", [month])).v);
  const alertes = await all("SELECT * FROM v_alertes_stock");
  const peremptions = await all("SELECT * FROM v_peremption WHERE jours_restants <= 30 ORDER BY jours_restants ASC");
  res.json({ caMonth, caToday, stockValue, creances, dettes, chargesMonth, alertes, peremptions });
}));

/* ---------- Initialisation (une seule fois) ---------- */
let _ready;
export async function ready() {
  if (!_ready) _ready = (async () => {
    try {
      await pool.query("SELECT 1");
      await pool.query("ALTER TABLE attachments ADD COLUMN IF NOT EXISTS data BYTEA").catch(() => {});
      console.log("✅ Connecté à PostgreSQL.");
    } catch (e) { console.error("❌ Connexion PostgreSQL :", e.message); }
  })();
  return _ready;
}
ready();                 // lance la vérif/migration au chargement (non bloquant)

// ROUTE_404 : renvoie un JSON clair si aucune route ne correspond
app.use((req, res) => res.status(404).json({ error: `Route API introuvable : ${req.method} ${req.originalUrl}` }));

export default app;      // Express app réutilisable (Render OU fonction serverless Vercel)
