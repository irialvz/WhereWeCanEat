import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WWCE — ¿Dónde comemos?',
  description: 'Pega el enlace de tu lista de Google Maps y te decimos qué sitios son para comer.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
