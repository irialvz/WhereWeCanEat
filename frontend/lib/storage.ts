const STORAGE_KEY = 'wwce.mapsListUrl';

export function getStoredUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (_) {
    return null;
  }
}

export function setStoredUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, url);
  } catch (_) {
    // localStorage puede fallar (modo privado, cuota); no bloqueamos el flujo por esto
  }
}

export function clearStoredUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (_) {
    // ignorar
  }
}
