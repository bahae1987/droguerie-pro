-- =====================================================================
--  DrogueriePro — Schéma v3
--  v2 (réception/facturation partielles, multi-commandes) + :
--   • Pièces jointes sur tous documents + clients/fournisseurs
--   • Charges & déplacements (marge nette par déplacement)
--   • Date d'expiration des produits
--   • Suivi créances/dettes (via paiements supprimables)
-- =====================================================================

-- ---------- Utilisateurs : profils & autorisations -------------------
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY, nom TEXT NOT NULL UNIQUE, code TEXT NOT NULL UNIQUE,
  permissions TEXT NOT NULL DEFAULT '{}', systeme INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, nom TEXT NOT NULL, login TEXT NOT NULL UNIQUE, email TEXT,
  password_hash TEXT NOT NULL, role_id TEXT REFERENCES roles(id) ON DELETE SET NULL,
  actif INTEGER DEFAULT 1, last_login TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY, user_id TEXT, user_nom TEXT, action TEXT, cible TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Paramètres & compteurs -----------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY, nom_entreprise TEXT, ice TEXT, rc TEXT, adresse TEXT,
  ville TEXT, tel TEXT, tva REAL DEFAULT 20, lang TEXT DEFAULT 'fr',
  c_devis INTEGER DEFAULT 1, c_commande INTEGER DEFAULT 1, c_bl INTEGER DEFAULT 1,
  c_facture INTEGER DEFAULT 1, c_cf INTEGER DEFAULT 1, c_br INTEGER DEFAULT 1,
  c_ff INTEGER DEFAULT 1, c_dep INTEGER DEFAULT 1, c_chg INTEGER DEFAULT 1
);

-- ---------- Tiers & produits -----------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY, nom TEXT NOT NULL, ice TEXT, tel TEXT, ville TEXT, contact TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY, nom TEXT NOT NULL, type TEXT DEFAULT 'particulier',
  ice TEXT, tel TEXT, ville TEXT, adresse TEXT, plafond_credit REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, ref TEXT, nom TEXT NOT NULL, categorie TEXT,
  fournisseur_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  prix_achat REAL DEFAULT 0, prix_vente REAL DEFAULT 0, quantite REAL DEFAULT 0,
  stock_min REAL DEFAULT 0, unite TEXT DEFAULT 'Pièce',
  date_expiration DATE,                               -- NEW : péremption
  nom_ar TEXT,                                        -- NEW : désignation arabe
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products(categorie);
CREATE INDEX IF NOT EXISTS idx_products_exp ON products(date_expiration);
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY, produit_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  type TEXT, qte REAL, motif TEXT, date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
--  PIÈCES JOINTES (générique : documents + clients + fournisseurs)
--  entity_type : client|supplier|product|purchase_order|reception|
--                supplier_invoice|sales_order|delivery|customer_invoice|
--                trip|expense
-- =====================================================================
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
  filename TEXT NOT NULL, original_name TEXT, mime TEXT, size INTEGER,
  uploaded_by TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_att_entity ON attachments(entity_type, entity_id);

-- =====================================================================
--  CIRCUIT D'ACHAT (partiel)
-- =====================================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY, date DATE NOT NULL,
  fournisseur_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  fournisseur_nom TEXT, fournisseur_ice TEXT, num_commande TEXT,
  taux_tva REAL DEFAULT 20, total_ht REAL DEFAULT 0, tva REAL DEFAULT 0, total_ttc REAL DEFAULT 0,
  statut TEXT DEFAULT 'ouvert', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id TEXT PRIMARY KEY, order_id TEXT REFERENCES purchase_orders(id) ON DELETE CASCADE,
  produit_id TEXT, ref TEXT, nom TEXT, prix_unit REAL,
  qte_commandee REAL DEFAULT 0, qte_recue REAL DEFAULT 0, qte_facturee REAL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_pol_order ON purchase_order_lines(order_id);
CREATE TABLE IF NOT EXISTS receptions (
  id TEXT PRIMARY KEY, date DATE NOT NULL, fournisseur_id TEXT, fournisseur_nom TEXT,
  num_reception TEXT, note TEXT, total_ht REAL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reception_lines (
  id TEXT PRIMARY KEY, reception_id TEXT REFERENCES receptions(id) ON DELETE CASCADE,
  order_line_id TEXT, order_id TEXT, produit_id TEXT, nom TEXT, prix_unit REAL, qte REAL
);
CREATE INDEX IF NOT EXISTS idx_recl_rec ON reception_lines(reception_id);
CREATE TABLE IF NOT EXISTS supplier_invoices (
  id TEXT PRIMARY KEY, date DATE NOT NULL, fournisseur_id TEXT, fournisseur_nom TEXT,
  fournisseur_ice TEXT, num_facture TEXT, base TEXT DEFAULT 'reception', taux_tva REAL DEFAULT 20,
  total_ht REAL DEFAULT 0, tva REAL DEFAULT 0, total_ttc REAL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS supplier_invoice_lines (
  id TEXT PRIMARY KEY, invoice_id TEXT REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  order_line_id TEXT, order_id TEXT, produit_id TEXT, nom TEXT, prix_unit REAL, qte REAL
);
CREATE TABLE IF NOT EXISTS purchase_payments (
  id TEXT PRIMARY KEY, invoice_id TEXT REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  date DATE, montant REAL, mode TEXT, note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
--  CIRCUIT DE VENTE (partiel)
-- =====================================================================
CREATE TABLE IF NOT EXISTS sales_orders (
  id TEXT PRIMARY KEY, date DATE NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_nom TEXT, client_ice TEXT, num_devis TEXT, num_commande TEXT,
  stage TEXT DEFAULT 'commande', taux_tva REAL DEFAULT 20,
  total_ht REAL DEFAULT 0, tva REAL DEFAULT 0, total_ttc REAL DEFAULT 0,
  statut TEXT DEFAULT 'ouvert', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sales_order_lines (
  id TEXT PRIMARY KEY, order_id TEXT REFERENCES sales_orders(id) ON DELETE CASCADE,
  produit_id TEXT, ref TEXT, nom TEXT, prix_unit REAL,
  qte_commandee REAL DEFAULT 0, qte_livree REAL DEFAULT 0, qte_facturee REAL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sol_order ON sales_order_lines(order_id);
CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY, date DATE NOT NULL, client_id TEXT, client_nom TEXT,
  num_bl TEXT, note TEXT, trip_id TEXT, total_ht REAL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS delivery_lines (
  id TEXT PRIMARY KEY, delivery_id TEXT REFERENCES deliveries(id) ON DELETE CASCADE,
  order_line_id TEXT, order_id TEXT, produit_id TEXT, nom TEXT, prix_unit REAL, qte REAL
);
CREATE INDEX IF NOT EXISTS idx_dl_del ON delivery_lines(delivery_id);
CREATE TABLE IF NOT EXISTS customer_invoices (
  id TEXT PRIMARY KEY, date DATE NOT NULL, client_id TEXT, client_nom TEXT, client_ice TEXT,
  num_facture TEXT, base TEXT DEFAULT 'livraison', taux_tva REAL DEFAULT 20,
  trip_id TEXT,                                       -- NEW : rattachement déplacement
  total_ht REAL DEFAULT 0, tva REAL DEFAULT 0, total_ttc REAL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS customer_invoice_lines (
  id TEXT PRIMARY KEY, invoice_id TEXT REFERENCES customer_invoices(id) ON DELETE CASCADE,
  order_line_id TEXT, order_id TEXT, produit_id TEXT, nom TEXT,
  prix_unit REAL, cout_unit REAL DEFAULT 0, qte REAL    -- NEW : cout_unit = prix d'achat au moment de la vente (pour marge)
);
CREATE TABLE IF NOT EXISTS sale_payments (
  id TEXT PRIMARY KEY, invoice_id TEXT REFERENCES customer_invoices(id) ON DELETE CASCADE,
  date DATE, montant REAL, mode TEXT, note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
--  CHARGES & DÉPLACEMENTS (marge nette par déplacement)
-- =====================================================================
-- Un déplacement = une tournée/sortie (livraison, achat, mission…)
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY, num_dep TEXT, date DATE NOT NULL, libelle TEXT,
  destination TEXT, responsable TEXT, vehicule TEXT,
  statut TEXT DEFAULT 'ouvert',                      -- ouvert | cloture
  note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Charges (personnel, transport, carburant, nourriture, péage…)
-- Rattachables à un déplacement (trip_id) ou générales (trip_id NULL)
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY, num_chg TEXT, date DATE NOT NULL,
  categorie TEXT NOT NULL,                           -- Transport|Carburant|Nourriture|Personnel|Péage|Hébergement|Autre
  libelle TEXT, montant REAL NOT NULL DEFAULT 0,
  trip_id TEXT REFERENCES trips(id) ON DELETE SET NULL,
  beneficiaire TEXT, mode TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exp_trip ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_ci_trip ON customer_invoices(trip_id);

-- =====================================================================
--  Vues
-- =====================================================================
CREATE VIEW IF NOT EXISTS v_creances AS
SELECT ci.id, ci.num_facture, ci.client_id, ci.client_nom, ci.date, ci.total_ttc,
  ci.total_ttc - COALESCE((SELECT SUM(montant) FROM sale_payments WHERE invoice_id=ci.id),0) AS reste
FROM customer_invoices ci;
CREATE VIEW IF NOT EXISTS v_dettes AS
SELECT si.id, si.num_facture, si.fournisseur_id, si.fournisseur_nom, si.date, si.total_ttc,
  si.total_ttc - COALESCE((SELECT SUM(montant) FROM purchase_payments WHERE invoice_id=si.id),0) AS reste
FROM supplier_invoices si;
CREATE VIEW IF NOT EXISTS v_alertes_stock AS
SELECT id, ref, nom, quantite, stock_min FROM products WHERE quantite <= stock_min;
-- Produits périmés / proches péremption
CREATE VIEW IF NOT EXISTS v_peremption AS
SELECT id, ref, nom, quantite, date_expiration,
  CAST(julianday(date_expiration) - julianday('now') AS INTEGER) AS jours_restants
FROM products WHERE date_expiration IS NOT NULL;
-- Situation créances par client
CREATE VIEW IF NOT EXISTS v_situation_clients AS
SELECT c.id, c.nom, c.tel, c.ville, c.plafond_credit,
  COALESCE(SUM(v.total_ttc),0) AS total_facture,
  COALESCE(SUM(v.total_ttc - v.reste),0) AS total_regle,
  COALESCE(SUM(v.reste),0) AS solde_du
FROM clients c LEFT JOIN v_creances v ON v.client_id=c.id
GROUP BY c.id;
-- Situation dettes par fournisseur
CREATE VIEW IF NOT EXISTS v_situation_fournisseurs AS
SELECT s.id, s.nom, s.tel, s.ville,
  COALESCE(SUM(d.total_ttc),0) AS total_facture,
  COALESCE(SUM(d.total_ttc - d.reste),0) AS total_regle,
  COALESCE(SUM(d.reste),0) AS solde_du
FROM suppliers s LEFT JOIN v_dettes d ON d.fournisseur_id=s.id
GROUP BY s.id;
-- Restes achat / vente par ligne
CREATE VIEW IF NOT EXISTS v_achat_restes AS
SELECT l.*, po.num_commande, po.fournisseur_id, po.fournisseur_nom,
  (l.qte_commandee-l.qte_recue) reste_a_recevoir,
  (l.qte_commandee-l.qte_facturee) reste_facturer_cmd,
  (l.qte_recue-l.qte_facturee) reste_facturer_rec
FROM purchase_order_lines l JOIN purchase_orders po ON po.id=l.order_id;
CREATE VIEW IF NOT EXISTS v_vente_restes AS
SELECT l.*, so.num_commande, so.client_id, so.client_nom,
  (l.qte_commandee-l.qte_livree) reste_a_livrer,
  (l.qte_commandee-l.qte_facturee) reste_facturer_cmd,
  (l.qte_livree-l.qte_facturee) reste_facturer_liv
FROM sales_order_lines l JOIN sales_orders so ON so.id=l.order_id;

-- =====================================================================
--  Données initiales
-- =====================================================================
INSERT INTO roles (id,nom,code,systeme,permissions) VALUES
 ('role-admin','Administrateur','admin',1,'{"*":true}'),
 ('role-gerant','Gérant','gerant',1,'{"dashboard.read":true,"products.read":true,"products.write":true,"sales.read":true,"sales.write":true,"sales.pay":true,"sales.delete":true,"purchases.read":true,"purchases.write":true,"purchases.pay":true,"purchases.delete":true,"clients.read":true,"clients.write":true,"suppliers.read":true,"suppliers.write":true,"settings.read":true,"finance.read":true,"finance.write":true,"expenses.read":true,"expenses.write":true}'),
 ('role-vendeur','Vendeur','vendeur',1,'{"dashboard.read":true,"products.read":true,"sales.read":true,"sales.write":true,"sales.pay":true,"clients.read":true,"clients.write":true,"finance.read":true}'),
 ('role-magasinier','Magasinier','magasinier',1,'{"dashboard.read":true,"products.read":true,"products.write":true,"purchases.read":true,"purchases.write":true,"suppliers.read":true,"expenses.read":true,"expenses.write":true}');
INSERT INTO users (id,nom,login,email,password_hash,role_id,actif) VALUES
 ('user-admin','Administrateur','admin','admin@droguerie.ma',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','role-admin',1);
INSERT INTO settings (id,nom_entreprise,ice,rc,adresse,ville,tel,tva,lang)
VALUES (1,'Droguerie Al Baraka','002456789000045','45821','N°12, Avenue Mohammed V','Marrakech','0524-44-55-66',20,'fr');
