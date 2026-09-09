const express = require('express');
const cors = require('cors');
const { PORT, FRONTEND_URL } = require('./config');
const extractRouter = require('./routes/extract');

const app = express();

app.use(cors({ origin: FRONTEND_URL === '*' ? true : FRONTEND_URL }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', extractRouter);

app.listen(PORT, () => {
  console.log(`scraper-service escuchando en el puerto ${PORT}`);
});
