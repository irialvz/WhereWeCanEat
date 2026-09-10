const express = require('express');
const { scrapeMapsList, ScrapeError } = require('../scraper');

const router = express.Router();

const URL_RE = /^https:\/\/(maps\.app\.goo\.gl\/|(www\.)?google\.[a-z.]+\/maps\/)/i;

const ERROR_STATUS = {
  invalid_url: 400,
  not_a_list: 422,
  list_unreachable: 422,
  no_gastronomic_results: 422,
  scrape_timeout: 504,
  internal_error: 500,
};

router.post('/extract', async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string' || !URL_RE.test(url)) {
    return res.status(400).json({
      success: false,
      errorCode: 'invalid_url',
      message: 'La URL no parece ser un enlace válido de una lista de Google Maps.',
    });
  }

  try {
    const result = await scrapeMapsList(url);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof ScrapeError) {
      const status = ERROR_STATUS[err.code] || 500;
      return res
        .status(status)
        .json({ success: false, errorCode: err.code, message: err.message, debug: err.debug });
    }
    console.error('internal_error', err);
    return res.status(500).json({
      success: false,
      errorCode: 'internal_error',
      message: 'Algo ha fallado procesando la lista. Inténtalo de nuevo.',
    });
  }
});

module.exports = router;
