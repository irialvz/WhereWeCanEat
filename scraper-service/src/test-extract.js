const { scrapeMapsList } = require('./scraper');

const TEST_URL = process.argv[2] || 'https://maps.app.goo.gl/1kRAX8KQFhtGmVgr9';

(async () => {
  console.log(`Probando extracción con: ${TEST_URL}`);
  const start = Date.now();
  try {
    const result = await scrapeMapsList(TEST_URL);
    console.log('--- RESULTADO ---');
    console.log('listName:', result.listName);
    console.log('totalSitesFound:', result.totalSitesFound);
    console.log('gastronomicCount:', result.gastronomicCount);
    console.log('partial:', result.partial);
    console.log('durationMs:', result.meta.durationMs);
    console.log('--- Primeros 10 sitios gastronómicos ---');
    result.sites.slice(0, 10).forEach((s) => {
      console.log(JSON.stringify(s, null, 2));
    });
    const withMapsUrl = result.sites.filter((s) => s.mapsUrl).length;
    const withCity = result.sites.filter((s) => s.city).length;
    const withPrice = result.sites.filter((s) => s.priceRange).length;
    console.log(`\nCon mapsUrl: ${withMapsUrl}/${result.sites.length}`);
    console.log(`Con city: ${withCity}/${result.sites.length}`);
    console.log(`Con priceRange: ${withPrice}/${result.sites.length}`);
  } catch (err) {
    console.error('ERROR:', err.code || '(sin código)', err.message);
    process.exitCode = 1;
  } finally {
    console.log(`Tiempo total: ${Date.now() - start}ms`);
  }
})();
