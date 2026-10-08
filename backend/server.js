/* Lanceur local / Render : importe l'app et écoute sur un port. */
import app from "./app.js";
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API DrogueriePro v3 (PostgreSQL) sur le port ${PORT}`));
