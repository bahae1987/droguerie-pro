# Déploiement — Supabase + Vercel (sans autre service)

Vous gardez **exactement** votre configuration : **Supabase** (base) + **Vercel** (via GitHub).
Le backend tourne maintenant **dans Vercel** sous forme de fonctions serverless (dossier `frontend/api/`).
L'interface et l'API sont au même endroit → pas de CORS, l'interface appelle simplement `/api/...`.

```
frontend/                 ← c'est CE dossier que Vercel déploie
├── src/                  (interface React)
├── api/
│   ├── [...path].js      (reçoit toutes les routes /api/* et les passe à l'app)
│   └── _lib/app.js       (toute l'API : ventes, achats, stock, finance… → PostgreSQL)
├── vercel.json
└── package.json          (contient aussi les dépendances backend : express, pg…)
```

## 1) Supabase — récupérer la chaîne de connexion
Supabase → **Project Settings → Database → Connection string → URI**.
Prenez le mode **Transaction (port 6543, "pooler")** — c'est celui adapté au serverless.
Exemple : `postgresql://postgres.xxxx:MOTDEPASSE@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`

## 2) Vercel — réglages du projet
Projet Vercel → **Settings → Environment Variables**, ajoutez :
- `DATABASE_URL` = la chaîne Supabase ci-dessus
- `JWT_SECRET` = une longue chaîne aléatoire
- `VITE_API_URL` = `/api`   ← important : chemin relatif (même origine)

Vérifiez que la **Root Directory** du projet Vercel est bien `frontend` (là où sont `src/` et `api/`).
Framework Preset : **Vite**.

## 3) Déployer
Poussez sur GitHub (ou **Deployments → Redeploy**). Vercel installe les dépendances,
construit l'interface et publie les fonctions `api/` automatiquement.

## 4) Vérifier
- Ouvrez `https://VOTRE-SITE.vercel.app/api/health` → doit afficher `{"ok":true,"db":true,...}`.
- Puis la page de login : **admin / admin123** (ou vos comptes migrés : vendeur / V1234, gerant / G1234).

---
## Développement en local (optionnel)
Deux façons :
- **Simple** : `npm i -g vercel` puis, dans `frontend/`, `vercel dev` (lance interface + fonctions ensemble). Mettez `DATABASE_URL` et `JWT_SECRET` dans un fichier `.env` local.
- **Séparé** : lancer l'API à part avec `cd backend && npm install && npm start` (port 4000), et dans `frontend/.env` mettre `VITE_API_URL=http://localhost:4000/api`, puis `npm run dev`.

## Dépannage "Failed to fetch"
- `…/api/health` ne répond pas (404/500) → regardez **Vercel → Deployments → (dernier) → Functions / Logs**. Souvent `DATABASE_URL` manquant ou mal copié.
- `{"ok":true,"db":false}` → `DATABASE_URL` n'est pas défini dans les variables Vercel.
- Login échoue avec erreur SSL/connexion → vérifiez que vous utilisez bien l'URL **pooler (port 6543)** de Supabase.

> Le dossier `backend/` reste fourni : il permet, si un jour vous préférez, d'héberger l'API
> sur un serveur classique (Render, VPS) avec `npm start`. Les deux partagent le même code (`app.js`).
