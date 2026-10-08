# DrogueriePro V46 — MAJ (mise à jour, sans refonte)

Cette version = votre application V46 + les 5 modules/correctifs :
1. Correctif annulation de règlement (la facture se rouvre / redevient modifiable)
2. Date de péremption sur les produits (+ alerte 30 jours)
3. Module Charges & Déplacements (marge nette par déplacement) — SaaS
4. Pièces jointes sur documents, clients, fournisseurs, produits — SaaS
5. Créances & Dettes : relevé (situation) par client/fournisseur

Architecture V46 : React (Vite) + Supabase direct (pas de backend).

## 1) Base de données Supabase
IMPORTANT : V46 utilise une structure (colonnes anglaises, id bigint) DIFFÉRENTE
de la base « V53 » actuelle. V46 doit donc avoir SA PROPRE base Supabase.
-> Créez un NOUVEAU projet Supabase (ou un projet vide), puis dans SQL Editor
   exécutez : database/SETUP_COMPLET_SUPABASE.sql
-> Supabase -> Storage -> New bucket -> nom exact : attachments

## 2) Frontend (Vercel)
- Poussez ce dépôt sur GitHub, connectez-le à Vercel (framework : Vite).
- Variables d'environnement Vercel :
    VITE_SUPABASE_URL      = https://<votre-projet>.supabase.co
    VITE_SUPABASE_ANON_KEY = <clé anon du projet>
- Build command : npm run build   |   Output : dist

## 3) Connexion
Comptes par défaut créés par le script (si absents) :
   admin / admin123        (Administrateur)
   superadmin / superadmin123   (SuperAdmin : centre SaaS)
Changez ces mots de passe après la première connexion.

## Mode SaaS
Les modules (anciens + nouveaux « expenses » et « attachments ») sont dans
la table saas_modules, activables/désactivables depuis le centre SuperAdmin.
