const express = require('express');
const cors = require('cors');
const { PORT, FRONTEND_URL } = require('./config');
const extractRouter = require('./routes/extract');

const app = express();

// Vercel genera un dominio nuevo (*.vercel.app) por cada deploy de preview, además del
// dominio de producción — por eso, en vez de fijar una única URL exacta en FRONTEND_URL
// (frágil y fácil de dejar desactualizada), aceptamos también cualquier origen *.vercel.app.
const VERCEL_ORIGIN_RE = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

app.use(
  cors({
    origin(origin, callback) {
      if (FRONTEND_URL === '*' || !origin) return callback(null, true);
      if (origin === FRONTEND_URL || VERCEL_ORIGIN_RE.test(origin)) return callback(null, true);
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', extractRouter);

app.listen(PORT, () => {
  console.log(`scraper-service escuchando en el puerto ${PORT}`);
});
