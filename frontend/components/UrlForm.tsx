'use client';

import { useState } from 'react';
import Card from './Card';
import Logo from './Logo';
import { MAPS_URL_RE } from '../lib/api';

type Props = {
  initialUrl?: string;
  onSubmit: (url: string, remember: boolean) => void;
};

export default function UrlForm({ initialUrl, onSubmit }: Props) {
  const [url, setUrl] = useState(initialUrl || '');
  const [remember, setRemember] = useState(false);
  const [touched, setTouched] = useState(false);

  const trimmed = url.trim();
  const isValid = MAPS_URL_RE.test(trimmed);
  const showError = touched && trimmed.length > 0 && !isValid;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(trimmed, remember);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 20px' }}>
      <Card>
        <Logo />
        <h1 style={{ fontSize: 34, margin: '0 0 14px' }}>¿Dónde comemos?</h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: '#4b5540', margin: '0 0 20px' }}>
          Pega el enlace de tu lista de Google Maps y te decimos qué sitios son para comer.
          Fuera escaladas, hoteles y librerías.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Pega aquí el enlace de tu lista"
            style={{
              width: '100%',
              padding: '13px 14px',
              fontSize: 14,
              borderRadius: 10,
              border: `1.5px solid ${showError ? 'var(--error)' : 'var(--olive-leaf)'}`,
              marginBottom: 8,
              outline: 'none',
              background: '#fff',
              color: 'var(--black-forest)',
            }}
          />
          {showError && (
            <p style={{ color: 'var(--error)', fontSize: 13, margin: '0 0 8px' }}>
              Ese enlace no parece de una lista de Google Maps. Prueba a copiarlo de nuevo desde
              &quot;Compartir&quot;.
            </p>
          )}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              margin: '8px 0 20px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--olive-leaf)' }}
            />
            Recuérdame la próxima vez
          </label>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 10,
              border: 'none',
              background: 'var(--olive-leaf-dark)',
              color: '#fdf7e2',
              cursor: 'pointer',
            }}
          >
            Vamos a ver qué hay
          </button>
        </form>
      </Card>
    </div>
  );
}
