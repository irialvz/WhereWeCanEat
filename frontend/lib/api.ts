import type { ExtractResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_SCRAPER_API_URL || 'http://localhost:4000';

export const MAPS_URL_RE = /^https:\/\/(maps\.app\.goo\.gl\/|(www\.)?google\.[a-z.]+\/maps\/)/i;

const FETCH_TIMEOUT_MS = 180000;

export async function extractList(url: string): Promise<ExtractResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/api/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
    const data = (await res.json()) as ExtractResponse;
    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        success: false,
        errorCode: 'scrape_timeout',
        message: 'Esto está tardando más de la cuenta. Inténtalo de nuevo en un momento.',
      };
    }
    return {
      success: false,
      errorCode: 'internal_error',
      message: 'No hemos podido conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
