# WWCE — ¿Dónde comemos?

MVP: pega la URL pública de tu lista de Google Maps y filtra solo los sitios gastronómicos por ciudad, precio y tipo de cocina. La lista de Maps es la única fuente de datos.

## Estructura

- `frontend/` — Next.js (App Router), UI con el flujo Llegada → Carga → Resultados → Error.
- `scraper-service/` — Node/Express + Puppeteer, extrae los sitios de una lista de Maps bajo demanda.

## Desarrollo local

**Backend:**
```bash
cd scraper-service
npm install
node src/index.js        # escucha en :4000
```

**Frontend** (en otra terminal):
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_SCRAPER_API_URL=http://localhost:4000" > .env.local
npm run dev               # http://localhost:3000
```

Prueba rápida del backend sin frontend:
```bash
cd scraper-service
node src/test-extract.js "https://maps.app.goo.gl/tu-lista"
```

## Despliegue

**Backend (Render, Web Service con Docker):**
1. Nuevo Web Service → conectar el repo → root directory `scraper-service` → Environment: Docker.
2. Variables de entorno (ver `.env.example`): `PORT=4000`, `FRONTEND_URL=<url de tu Vercel>`, `MAX_SCRAPE_MS=120000`, `MAX_SITES=250`.
3. La capa gratuita de Render duerme tras ~15 min de inactividad; antes de una demo, haz un `curl` a `/health` para "calentarlo".

**Frontend (Vercel):**
1. Importar el repo → root directory `frontend`.
2. Variable de entorno: `NEXT_PUBLIC_SCRAPER_API_URL=<url de tu backend en Render>`.
3. Deploy.

## Limitaciones conocidas (aceptadas para este MVP)

- **Scraping no oficial**: no hay API pública de Google Maps para listas; esto lee el DOM de la página con Puppeteer. Puede romperse si Google cambia su interfaz, e incumple los términos de servicio de Google — asumido como riesgo para un proyecto personal/demo.
- **Categoría/precio no siempre disponibles**: la lista de Maps carga cada tarjeta de forma asíncrona (imagen, categoría, precio) mientras haces scroll. En listas grandes, una fracción de los sitios puede quedar sin categoría legible en el momento de leerla y por tanto excluirse del filtro gastronómico (comportamiento seguro por defecto, no un fallo — mejor omitir un sitio que clasificarlo mal). Un reintento suele capturar más.
- **Rendimiento bajo peticiones repetidas**: durante el desarrollo se observó que golpear la misma lista muchas veces seguidas en poco tiempo (varias decenas de peticiones en menos de una hora, todas desde la misma IP/máquina) degrada progresivamente los resultados — probablemente as una medida anti-automatización del lado de Google, no un fallo del código. Evita probar la misma URL de forma repetitiva y seguida; en producción (IP del servicio de hosting, tráfico real de usuarios) no debería notarse.
- **`city`/`address` no se rellenan**: la vista de lista no expone la dirección completa sin un clic adicional por sitio, que no se hace por coste de tiempo. El buscador de ciudad del frontend puede quedar vacío según la lista.
- **`mapsUrl` es un enlace de búsqueda**, no el enlace directo a la ficha (las tarjetas no exponen un `href` accesible sin clic); abre Maps buscando el nombre del sitio, que en la práctica lleva al resultado correcto en la inmensa mayoría de los casos.
- **Sin caché**: cada visita reescanea la lista completa (puede tardar hasta 1-3 minutos en listas grandes).

## Verificación

1. `curl http://localhost:4000/health` → `{"status":"ok"}`.
2. `node scraper-service/src/test-extract.js "<tu URL>"` → revisa `totalSitesFound`, `gastronomicCount` y que la mayoría de sitios tengan `category` y `priceRange`.
3. Desde el frontend: pega la URL, marca "recordar", recarga y confirma que salta directo a la carga. Prueba los filtros de ciudad/precio/cocina y haz clic en una fila para comprobar que abre Maps.
