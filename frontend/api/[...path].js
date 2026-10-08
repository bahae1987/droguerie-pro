import app, { ready } from "./_lib/app.js";
export default async function handler(req, res) {
  await ready();          // s'assure que la connexion/migration est prête
  return app(req, res);   // délègue à l'app Express
}
