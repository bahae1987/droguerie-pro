# Migration de l'ancienne base (V46) vers DrogueriePro v3

Votre sauvegarde `DrogueriePro_Backup_2026-10-08.sql` a été migrée vers le schéma v3.
Le résultat est **déjà prêt** : `backend/droguerie.db` (base peuplée) et `backend/droguerie-data.sql` (dump portable).

## Ce qui a été migré
| Donnée | Résultat v3 |
|---|---|
| Produits (10) | avec **noms arabes** (`nom_ar`) et stock final conservé |
| Clients (3), Fournisseurs (3) | tels quels |
| Utilisateurs (4) | mots de passe **re-hachés en bcrypt** (admin/admin123, vendeur/V1234, gerant/G1234, superadmin→admin) |
| Ventes (14) | **éclatées** en 10 commandes/devis, 7 BL, 11 factures, 9 encaissements |
| Facturation partielle | reconstituée (commande 13 → 2 factures ; commande 9 → 2 factures) |
| Achats (2) | 2 commandes, 2 réceptions, 1 facture fournisseur, 1 règlement |
| Mouvements de stock (67) | conservés comme historique |
| Traçabilité (73) | reprise dans `audit_log` |

Contrôle d'intégrité : 45 234 DH facturés − 4 527 DH encaissés = **40 707 DH de créances** (identique à vos impayés).

## Démarrer sur ces données
```bash
cd backend
npm install
npm start          # l'API démarre directement sur droguerie.db (déjà peuplé)
```
> Au démarrage, le serveur n'initialise le schéma que si la base est vide : ici elle est déjà remplie, vos exemples s'affichent immédiatement.

## Re-migrer une autre sauvegarde plus tard
```bash
cd backend
npm run migrate -- chemin/vers/backup.sql droguerie.db
```
Le script `migrate-from-backup.js` (sql.js + bcryptjs, aucune compilation native) relit un dump
et régénère `droguerie.db` + un dump `*-data.sql`.

## Points d'adaptation (ancien → nouveau)
- **Multi-droguerie (branches)** : l'ancien système gérait plusieurs drogueries. Le v3 étant mono-magasin,
  les données sont **fusionnées** en un seul magasin (les produits d'autres succursales gardent des id distincts).
  Si vous voulez le multi-magasin, c'est une évolution à part (table `branches` + filtrage).
- **Couche SaaS** (tenants, modules, permissions fines) : non reprise — le v3 utilise ses 4 profils
  (Administrateur, Gérant, Vendeur, Magasinier) avec permissions intégrées.
- **Numérotation** : vos anciens numéros (FACV-, CMDV-, BLV-…) sont **conservés** sur les documents migrés ;
  les nouveaux documents créés dans v3 utilisent les séries DEV/BC/BL/FAC/CF/BR/FF, démarrées après vos derniers numéros.
