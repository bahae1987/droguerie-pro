# DrogueriePro v3 — Nouveautés

## 1. Module Créances & Dettes (situation par client/fournisseur)
- **Situation globale** : `GET /api/finance/clients` et `/api/finance/suppliers`
  → pour chaque tiers : total facturé, total réglé, **solde dû**.
- **Relevé de compte détaillé** : `GET /api/finance/clients/:id` (et `/suppliers/:id`)
  → grand livre chronologique (débit = facture, crédit = règlement) avec **solde courant** ligne par ligne.
- Écran web prêt : `frontend/src/Finance.jsx` (onglets clients/fournisseurs + relevé imprimable).
- Champ `plafond_credit` ajouté au client (pour alerter en cas de dépassement).

## 2. Correction : annulation d'un règlement
- **Bug corrigé** : une facture restait « clôturée » et non modifiable après un paiement.
- Le statut de règlement est **toujours recalculé** à partir des paiements (jamais figé).
- Nouveaux endpoints pour **annuler un règlement** :
  - `DELETE /api/customer-invoices/:id/pay/:payId`
  - `DELETE /api/supplier-invoices/:id/pay/:payId`
  → après annulation, la facture repasse en « non réglée » / « partielle » et redevient exploitable.

## 3. Pièces jointes sur TOUS les documents + clients/fournisseurs
- Table générique `attachments (entity_type, entity_id, …)`.
- `entity_type` possibles : client, supplier, product, purchase_order, reception,
  supplier_invoice, sales_order, delivery, customer_invoice, trip, expense.
- Endpoints : `POST /api/attachments/:type/:id` (multipart, champ `file`, max 15 Mo),
  `GET /api/attachments/:type/:id`, `GET /api/attachments/file/:id` (téléchargement), `DELETE /api/attachments/:id`.
- Composant web réutilisable : `frontend/src/Attachments.jsx` →
  `<Attachments entityType="customer_invoice" entityId={facture.id} />`.
- Fichiers stockés dans `backend/uploads/` (configurable via `UPLOAD_DIR`).

## 4. Charges & Déplacements (marge nette par déplacement)
- **Déplacements** (`trips`) : tournées/sorties avec libellé, destination, responsable, véhicule.
- **Charges** (`expenses`) : Transport, Carburant, Nourriture, Personnel, Péage, Hébergement, Autre
  — rattachées à un déplacement ou générales.
- Les **factures** peuvent être rattachées à un déplacement (`trip_id`).
- **Marge nette** : `GET /api/trips/:id/margin`
  → CA HT − coût d'achat (COGS, basé sur le prix d'achat enregistré au moment de la vente) − charges.
  Chaque ligne de facture stocke `cout_unit` pour un calcul fiable même si le prix d'achat change ensuite.
- Écran web prêt : `frontend/src/Charges.jsx` (liste déplacements + KPI marge + charges).
- Permissions : `expenses.read` / `expenses.write` et `finance.read` / `finance.write`
  (déjà attribuées aux profils Gérant, et partiellement Vendeur/Magasinier).

## 5. Date d'expiration des produits
- Colonne `date_expiration` ajoutée à `products`.
- Vue `v_peremption` + endpoint `GET /api/products/peremption?jours=90`
  → produits périmés ou proches de la péremption (jours restants).
- Le tableau de bord remonte les péremptions à ≤ 30 jours.

---
## Câblage de l'interface bilingue
`frontend/src/main.jsx` passe désormais à votre `AppUI.jsx` un objet `pages` :
```js
pages={{ finance:<Finance/>, charges:<Charges/>, users:<Users/> }}
```
Ajoutez dans votre menu latéral trois entrées (Créances/Dettes, Charges, Utilisateurs)
qui affichent `pages.finance`, `pages.charges`, `pages.users` quand ils ne sont pas `null`.
Pour les pièces jointes, importez `Attachments` et placez `<Attachments entityType=… entityId=…/>`
dans chaque fiche (client, fournisseur, facture, BL, réception, etc.).
