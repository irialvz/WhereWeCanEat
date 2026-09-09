const { isGastronomic } = require('./gastronomicKeywords');

const RATING_RE = /^(\d[.,]\d)\s*(?:★|stars?)?\s*(?:\((\d+(?:[.,]\d+)?[kK]?)\))?$/;
const RATING_INLINE_RE = /(\d[.,]\d)\s*(?:★|stars?)?\s*\((\d+(?:[.,]\d+)?[kK]?)\)/;
const PRICE_RANGE_RE = /(\d+)\s*[-–]\s*(\d+)\s*€/;
const PRICE_SYMBOL_RE = /^€{1,4}$/;
const PRICE_SYMBOL_FALLBACK = {
  '€': { min: 0, max: 15 },
  '€€': { min: 15, max: 30 },
  '€€€': { min: 30, max: 60 },
  '€€€€': { min: 60, max: 120 },
};

function parseReviewCount(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(',', '.');
  if (/k$/i.test(cleaned)) {
    return Math.round(parseFloat(cleaned) * 1000);
  }
  return parseInt(cleaned.replace('.', ''), 10) || null;
}

function parseRatingLine(line) {
  const m = line.match(RATING_INLINE_RE) || line.match(RATING_RE);
  if (!m) return null;
  const rating = parseFloat(m[1].replace(',', '.'));
  const reviewCount = parseReviewCount(m[2]);
  return { rating, reviewCount };
}

function parsePriceFromLine(line) {
  const rangeMatch = line.match(PRICE_RANGE_RE);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10),
      currency: 'EUR',
      approx: false,
    };
  }
  const symbolToken = line.split('·').map((s) => s.trim()).find((s) => PRICE_SYMBOL_RE.test(s));
  if (symbolToken && PRICE_SYMBOL_FALLBACK[symbolToken]) {
    return { ...PRICE_SYMBOL_FALLBACK[symbolToken], currency: 'EUR', approx: true };
  }
  return null;
}

/**
 * Parsea el innerText multilínea de una tarjeta de sitio del panel de Maps.
 * Formato observado: nombre, [rating (nº reseñas)], [categoría · precio/rango], [nota libre].
 */
function parseCardText(rawText, index) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const name = lines[0];
  let rest = lines.slice(1);

  let rating = null;
  let reviewCount = null;
  if (rest[0]) {
    const parsedRating = parseRatingLine(rest[0]);
    if (parsedRating) {
      rating = parsedRating.rating;
      reviewCount = parsedRating.reviewCount;
      rest = rest.slice(1);
    }
  }

  // La línea de "precio · categoría" es la siguiente tras el rating (si existe);
  // cualquier línea posterior a esa es ya una nota libre añadida por quien creó la lista.
  let category = null;
  let priceRange = null;
  if (rest[0]) {
    const parts = rest[0].split('·').map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (!priceRange) {
        const p = parsePriceFromLine(part);
        if (p) {
          priceRange = p;
          continue;
        }
      }
      if (!category) category = part;
    }
    rest = rest.slice(1);
  }

  const note = rest.length > 0 ? rest.join(' ') : null;

  return {
    id: `site-${index}`,
    name,
    category: category || 'Sin categoría',
    isGastronomic: isGastronomic(category),
    rating,
    reviewCount,
    priceRange,
    note,
    city: null,
    address: null,
    mapsUrl: null,
  };
}

module.exports = { parseCardText, parsePriceFromLine, parseRatingLine };
