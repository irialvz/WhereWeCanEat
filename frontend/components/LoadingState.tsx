'use client';

import { useEffect, useState } from 'react';
import Card from './Card';
import Logo from './Logo';

const MESSAGES = [
  'Estamos leyendo tu lista de Google Maps…',
  'Separando restaurantes de escaladas, hoteles y librerías…',
  'Casi listo, esto puede tardar hasta 1-3 minutos con listas grandes…',
];

export default function LoadingState() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const message = MESSAGES[Math.min(Math.floor(elapsed / 12), MESSAGES.length - 1)];
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeLabel = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 20px' }}>
      <Card>
        <Logo />
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 24px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '5px solid var(--card-border)',
              borderTopColor: 'var(--olive-leaf)',
              animation: 'wwce-spin 0.9s linear infinite',
            }}
          />
        </div>
        <p style={{ textAlign: 'center', fontSize: 15, margin: '0 0 6px', color: 'var(--black-forest)' }}>
          {message}
        </p>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#7a8468', margin: 0 }}>
          Tiempo transcurrido: {timeLabel}
        </p>
        <style>{`@keyframes wwce-spin { to { transform: rotate(360deg); } }`}</style>
      </Card>
    </div>
  );
}
