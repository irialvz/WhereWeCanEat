const GASTRONOMIC_KEYWORDS = [
  // Genéricos fuertes
  'cocina', 'restaurante', 'comida', 'gastro',

  // Tipos de establecimiento
  'bar', 'cafeteria', 'cafe', 'cantina', 'taberna', 'bodega',
  'gastrobar', 'cerveceria', 'marisqueria', 'asador', 'parrilla',
  'pizzeria', 'hamburgueseria', 'bocateria', 'panaderia',
  'pasteleria', 'heladeria', 'chocolateria', 'churreria',
  'freiduria', 'vinoteca', 'cocteleria', 'teteria', 'creperia',
  'tapas', 'taperia', 'brunch', 'buffet', 'bufe',
  'foodtruck', 'food truck', 'mercado gastronomico', 'sidreria',

  // Cocinas / nacionalidades
  'sushi', 'ramen', 'pho', 'kebab', 'paella',
  'japonesa', 'coreana', 'china', 'tailandesa', 'vietnamita',
  'india', 'mexicana', 'peruana', 'argentina', 'mediterranea',
  'italiana', 'francesa', 'griega', 'libanesa', 'turca',
  'marroqui', 'arabe', 'fusion', 'vegana', 'vegetariana',
  'autor', 'casera', 'tradicional', 'espanola', 'andaluza',
  'gallega', 'vasca', 'canaria', 'catalana',
];

const DIACRITICS_RANGE_START = 0x0300;
const DIACRITICS_RANGE_END = 0x036f;

function normalize(str) {
  const lower = (str || '').toLowerCase().normalize('NFD');
  let out = '';
  for (const ch of lower) {
    const code = ch.codePointAt(0);
    if (code >= DIACRITICS_RANGE_START && code <= DIACRITICS_RANGE_END) continue;
    out += ch;
  }
  return out;
}

function isGastronomic(categoryText) {
  const normalized = normalize(categoryText);
  if (!normalized) return false;
  return GASTRONOMIC_KEYWORDS.some((k) => normalized.includes(k));
}

module.exports = { GASTRONOMIC_KEYWORDS, isGastronomic, normalize };
