module.exports = {
  PORT: process.env.PORT || 4000,
  FRONTEND_URL: process.env.FRONTEND_URL || '*',
  MAX_SCRAPE_MS: Number(process.env.MAX_SCRAPE_MS || 120000),
  MAX_SITES: Number(process.env.MAX_SITES || 250),
  CONSENT_TIMEOUT_MS: 10000,
  FEED_TIMEOUT_MS: 45000,
  SCROLL_STABLE_ROUNDS: 5,
  SCROLL_PAUSE_MS: 1300,
};
