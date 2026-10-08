# DrogueriePro — Application complète de gestion de droguerie

Gestion de **stock**, **circuit de vente** (Devis → Commande → Livraison → Facture → Encaissement), **circuit d'achat** (Commande → Réception → Facture fournisseur → Règlement), **clients/fournisseurs**, **utilisateurs par profils & autorisations**, interface **bilingue Français / العربية**, **web + mobile**.

```
droguerie-pro/
├── backend/            API Node.js + SQLite (base de données + logique métier + auth/rôles)
│   ├── schema.sql      ← LE FICHIER DE BASE DE DONNÉES (structure + rôles + admin)
│   ├── server.js       API REST complète
│   └── Dockerfile
├── frontend/           Application web (React + Vite + Tailwind)
│   ├── src/api.js      client API + permissions
│   ├── src/Users.jsx   écran connexion + gestion utilisateurs/profils
│   └── src/AppUI.reference.jsx  ← votre interface bilingue (à brancher sur l'API)
├── mobile/             Application mobile (React Native / Expo, Android + iOS)
│   └── App.js
└── docker-compose.yml
```

## Profils & autorisations (livrés par défaut)
| Profil | Peut faire |
|---|---|
| **Administrateur** | Tout, y compris gérer les utilisateurs |
| **Gérant** | Tout sauf gestion des utilisateurs |
| **Vendeur** | Ventes + clients + consulter stock (ne peut ni modifier le stock ni voir les achats) |
| **Magasinier** | Stock + achats/réceptions (ne peut pas vendre) |

Chaque autorisation est cochable individuellement (products.read, sales.write, sales.delete, users.write…). Compte initial : **admin / admin123** (à changer immédiatement).

---

# 🚀 Déploiement

## 1) Backend (la base de données)

```bash
cd backend
cp .env.example .env          # mettez un JWT_SECRET long et aléatoire
npm install                   # compile SQLite (nécessite python3/make/g++)
npm start                     # démarre l'API sur http://localhost:4000
```
Au premier lancement, `schema.sql` crée automatiquement le fichier **droguerie.db** avec toutes les tables, les 4 profils et le compte admin.

> Pour générer un mot de passe hashé (bcrypt) manuellement : `npm run hash "monMotDePasse"`

### Option Docker (recommandé en production)
```bash
docker compose up -d --build   # API + volume de données persistant
```

## 2) Frontend web
```bash
cd frontend
cp .env.example .env           # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                    # dev : http://localhost:5173
npm run build                  # prod : dossier dist/ à servir (Nginx, Vercel, Netlify…)
```
**À faire une fois** : renommez `src/AppUI.reference.jsx` en `src/AppUI.jsx` et branchez-le sur l'API en suivant `src/AppUI.README.txt` (remplacer `window.storage` par les fonctions de `api.js`, masquer les boutons avec `can(perms, ...)`).

## 3) Application mobile
```bash
cd mobile
npm install
# éditez la constante API dans App.js (IP de votre serveur, ex http://192.168.1.10:4000/api)
npx expo start                 # scannez le QR code avec l'app Expo Go (Android/iOS)
```
Pour publier : `eas build -p android` (APK/AAB) et `eas build -p ios`.

---

## Hébergement conseillé (Maroc / international)
- **Serveur** : un VPS (2 Go RAM suffisent) — la base SQLite est un simple fichier, sauvegardez-le régulièrement (`cp droguerie.db backup/`).
- **Montée en charge** : pour plusieurs magasins simultanés, migrez vers **PostgreSQL** (le `schema.sql` est compatible à 95 %, changez juste `AUTOINCREMENT`/types et le driver dans `server.js`).
- **HTTPS** : placez l'API derrière Nginx + Let's Encrypt, et servez le frontend `dist/` sur le même domaine.
- **Sauvegarde** : planifiez une copie quotidienne du fichier `droguerie.db` (cron).

## Sécurité (à faire avant la mise en production)
1. Changer `JWT_SECRET`.
2. Se connecter en admin et **changer le mot de passe admin**.
3. Créer un utilisateur par employé avec le bon profil.
4. Activer HTTPS.

## API (résumé)
`POST /api/auth/login` · `GET /api/products` · `POST /api/sales` (start: devis|facture) · `POST /api/sales/:id/advance` · `POST /api/sales/:id/pay` · `POST /api/purchases` (start: commande|reception) · `GET /api/users` · `GET /api/dashboard` … (toutes protégées par permission).
