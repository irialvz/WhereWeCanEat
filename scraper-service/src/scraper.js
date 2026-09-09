const puppeteer = require('puppeteer');
const { parseCardText } = require('./parser');
const {
  MAX_SCRAPE_MS,
  MAX_SITES,
  CONSENT_TIMEOUT_MS,
  FEED_TIMEOUT_MS,
  SCROLL_STABLE_ROUNDS,
  SCROLL_PAUSE_MS,
} = require('./config');

// Selector empírico validado en vivo (ver scraper-service/DEBUG_NOTES.md): las tarjetas de
// sitio de una lista compartida son <button class="SMP2wb ..."> y la lista está VIRTUALIZADA
// (Google solo mantiene en el DOM las tarjetas visibles + un buffer, recicla el resto al
// hacer scroll). Por eso acumulamos por nombre en cada "tick" de scroll en vez de leer el
// DOM una sola vez al final.
const CARD_SELECTOR = 'button.SMP2wb';
const FALLBACK_FEED_SELECTOR = 'div[role="feed"]';
const CONSENT_BUTTON_TEXTS = ['Aceptar todo', 'Accept all'];
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

class ScrapeError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const TICK_TIMEOUT_MS = 9000;

// Puppeteer, bajo carga, puede quedarse colgado en una llamada CDP concreta (visto en
// pruebas reales: un evaluate() tardó varios minutos en vez de milisegundos). Envolvemos
// cada operación del bucle de scroll con su propio timeout corto para poder tratar un
// cuelgue puntual como "esta ronda no dio nada" y seguir/cerrar en vez de bloquear toda la
// petición HTTP durante minutos.
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('tick_timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function acceptConsentIfPresent(page) {
  try {
    const clicked = await page.evaluate((texts) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const visible = buttons.filter((b) => {
        const rect = b.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && texts.includes((b.innerText || '').trim());
      });
      if (visible.length > 0) {
        visible[0].click();
        return true;
      }
      return false;
    }, CONSENT_BUTTON_TEXTS);

    if (clicked) {
      try {
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: CONSENT_TIMEOUT_MS });
      } catch (_) {
        // algunas veces no hay navegación "real" detectable; seguimos igualmente
      }
      return true;
    }
  } catch (_) {
    // no bloqueamos el flujo si no hay diálogo de consentimiento
  }
  return false;
}

async function waitForCards(page) {
  try {
    await page.waitForSelector(`${CARD_SELECTOR}, ${FALLBACK_FEED_SELECTOR}`, {
      timeout: FEED_TIMEOUT_MS,
    });
  } catch (_) {
    throw new ScrapeError('list_unreachable', 'No se pudo cargar el panel de la lista de Maps.');
  }
}

async function getListName(page) {
  try {
    return await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText.trim() : null;
    });
  } catch (_) {
    return null;
  }
}

// IMPORTANTE (validado empíricamente): cambiar `scrollTop` por JS NO dispara el lazy-load
// de Google Maps — hay que simular un scroll de ratón REAL (page.mouse.wheel) sobre el
// contenedor. El contenedor scrollable no es un ancestro a una distancia fija de la tarjeta
// (varía), así que se localiza subiendo por la cadena de padres hasta encontrar el primero
// cuyo scrollHeight sea mayor que su clientHeight.
async function findScrollableRect(page) {
  return page.evaluate((sel) => {
    const card = document.querySelector(sel);
    if (!card) return null;
    let el = card.parentElement;
    while (el && el.scrollHeight <= el.clientHeight + 10) el = el.parentElement;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, CARD_SELECTOR);
}

async function collectAllCards(page, startedAt) {
  const collected = new Map(); // nombre -> innerText crudo
  let stableRounds = 0;
  let partial = false;

  const rect = await findScrollableRect(page);
  if (rect) {
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  }

  while (true) {
    const elapsed = Date.now() - startedAt;
    if (elapsed > MAX_SCRAPE_MS) {
      partial = true;
      break;
    }

    let batch;
    try {
      batch = await withTimeout(
        page.evaluate((sel) => {
          return Array.from(document.querySelectorAll(sel)).map((btn) => btn.innerText || '');
        }, CARD_SELECTOR),
        TICK_TIMEOUT_MS
      );
    } catch (_) {
      // Un evaluate() colgado (visto en pruebas reales, puntualmente) no debe bloquear
      // la petición varios minutos: cerramos aquí con lo que ya tengamos.
      partial = true;
      break;
    }

    // OJO: una tarjeta recién scrolleada a veces se lee ANTES de que termine de cargar
    // su categoría/precio (imagen y texto llegan de forma asíncrona). Si solo la
    // guardásemos la primera vez, ese texto incompleto quedaría fijado para siempre y el
    // sitio se perdería del filtro gastronómico por falta de categoría. Por eso
    // sobrescribimos siempre con la lectura más reciente mientras la tarjeta siga en el
    // DOM; solo contamos como "nueva" la primera vez que aparece un nombre, para la
    // detección de estabilidad del scroll. Si aun así una tarjeta queda sin categoría
    // legible, se descarta del filtro gastronómico (comportamiento seguro por defecto) en
    // vez de arriesgarse a bloquear la petición con más pases de scroll.
    let newCount = 0;
    for (const text of batch) {
      const name = text.split('\n')[0]?.trim();
      if (!name) continue;
      if (!collected.has(name)) newCount += 1;
      collected.set(name, text);
    }

    if (collected.size >= MAX_SITES) {
      partial = true;
      break;
    }

    try {
      await withTimeout(page.mouse.wheel({ deltaY: 1600 }), TICK_TIMEOUT_MS);
    } catch (_) {
      // si el ratón falla o se cuelga (p.ej. contenedor desaparecido), lo tratamos como
      // fin de scroll en vez de bloquear la petición
      partial = true;
      break;
    }
    await sleep(SCROLL_PAUSE_MS);

    // Nota: NO usamos "cerca del final" (scrollHeight/scrollTop) como condición de parada.
    // Bajo carga (varios Chrome/Puppeteer a la vez) el renderizado virtualizado de Google
    // puede ir por detrás del scroll ya aplicado, dando una lectura de "ya está al final"
    // falsa que corta la extracción antes de tiempo. Nos basamos solo en rondas
    // consecutivas sin tarjetas nuevas, con margen suficiente para absorber ese retraso.
    if (newCount === 0) {
      stableRounds += 1;
      if (stableRounds >= SCROLL_STABLE_ROUNDS) break;
    } else {
      stableRounds = 0;
    }
  }

  return { collected, partial };
}

function buildMapsSearchUrl(name) {
  const query = encodeURIComponent(name);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

async function scrapeMapsList(url) {
  const startedAt = Date.now();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=es-ES'],
    defaultViewport: { width: 1366, height: 900 },
    protocolTimeout: MAX_SCRAPE_MS + 60000,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-ES,es;q=0.9' });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (err) {
      throw new ScrapeError('list_unreachable', `No se pudo abrir la URL: ${err.message}`);
    }

    await acceptConsentIfPresent(page);
    await waitForCards(page);

    const listName = await getListName(page);
    const { collected, partial } = await collectAllCards(page, startedAt);

    const totalSitesFound = collected.size;
    if (totalSitesFound === 0) {
      throw new ScrapeError('not_a_list', 'La URL no parece apuntar a una lista con sitios.');
    }

    let i = 0;
    const sites = [];
    for (const [name, rawText] of collected.entries()) {
      const parsed = parseCardText(rawText, i++);
      if (!parsed) continue;
      // El nombre completo detectado en el parseo puede truncarse distinto al de la key;
      // usamos siempre el nombre real de la tarjeta.
      parsed.name = name;
      parsed.mapsUrl = buildMapsSearchUrl(name);
      sites.push(parsed);
    }

    const gastronomicSites = sites.filter((s) => s.isGastronomic);

    if (gastronomicSites.length === 0) {
      throw new ScrapeError('no_gastronomic_results', 'No se encontró ningún sitio gastronómico en esta lista.');
    }

    return {
      success: true,
      partial,
      listName,
      totalSitesFound,
      gastronomicCount: gastronomicSites.length,
      sites: gastronomicSites,
      meta: {
        sourceUrl: url,
        scrapedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      },
    };
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeMapsList, ScrapeError };
