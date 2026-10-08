import app, { ready } from "./_lib/app.js";
ready();                 // prépare la connexion / micro-migration (non bloquant)
export default app;      // Vercel appelle app(req, res) pour TOUTES les routes /api/*
