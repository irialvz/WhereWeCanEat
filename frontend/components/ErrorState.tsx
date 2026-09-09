'use client';

import Card from './Card';
import Logo from './Logo';
import type { ExtractErrorCode } from '../lib/types';

const MESSAGES: Record<ExtractErrorCode, { title: string; body: string }> = {
  invalid_url: {
    title: 'Ese enlace no nos cuadra',
    body: 'Comprueba que sea un enlace de una lista de Google Maps (lo encuentras en Compartir → Copiar enlace).',
  },
  not_a_list: {
    title: 'Eso no es una lista',
    body: 'El enlace parece apuntar a un sitio suelto, no a una lista con varios sitios guardados.',
  },
  list_unreachable: {
    title: 'No hemos podido abrir tu lista',
    body: 'Puede que sea privada o que ya no exista. Revisa que esté compartida como pública y vuelve a intentarlo.',
  },
  no_gastronomic_results: {
    title: 'Ahí no hay nada para comer',
    body: 'Hemos mirado bien, pero en esta lista no encontramos ningún restaurante, bar o cafetería.',
  },
  scrape_timeout: {
    title: 'Esto se está alargando demasiado',
    body: 'Tu lista es grande y no nos ha dado tiempo a terminar. Inténtalo de nuevo en un momento.',
  },
  internal_error: {
    title: 'Se nos ha cruzado un cable',
    body: 'Algo ha fallado por nuestra parte. Inténtalo de nuevo en unos segundos.',
  },
};

type Props = {
  errorCode: ExtractErrorCode;
  message?: string;
  onRetry: () => void;
};

export default function ErrorState({ errorCode, message, onRetry }: Props) {
  const info = MESSAGES[errorCode] || MESSAGES.internal_error;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 20px' }}>
      <Card>
        <Logo />
        <h2 style={{ fontSize: 24, margin: '0 0 12px' }}>{info.title}</h2>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: '#4b5540', margin: '0 0 6px' }}>{info.body}</p>
        {message && (
          <p style={{ fontSize: 12, color: '#9a8f6a', margin: '0 0 20px' }}>{message}</p>
        )}
        <button
          onClick={onRetry}
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
            marginTop: 12,
          }}
        >
          Reintentar
        </button>
      </Card>
    </div>
  );
}
