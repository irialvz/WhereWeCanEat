'use client';

import { useMemo, useState } from 'react';
import Logo from './Logo';
import type { ExtractSuccess, Site } from '../lib/types';

type Props = {
  data: ExtractSuccess;
  onRetry: () => void;
};

function priceLabel(site: Site): string {
  if (!site.priceRange) return 'Precio no disponible';
  const { min, max, approx } = site.priceRange;
  return `${approx ? '~' : ''}${min}–${max} €`;
}

export default function ResultsView({ data, onRetry }: Props) {
  const sites = data.sites;

  const cuisines = useMemo(
    () => Array.from(new Set(sites.map((s) => s.category))).sort((a, b) => a.localeCompare(b, 'es')),
    [sites]
  );

  const priceBounds = useMemo(() => {
    const priced = sites.filter((s) => s.priceRange);
    if (priced.length === 0) return { min: 0, max: 100 };
    return {
      min: Math.min(...priced.map((s) => s.priceRange!.min)),
      max: Math.max(...priced.map((s) => s.priceRange!.max)),
    };
  }, [sites]);

  const [cityQuery, setCityQuery] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(new Set());
  const [minPrice, setMinPrice] = useState(priceBounds.min);
  const [maxPrice, setMaxPrice] = useState(priceBounds.max);

  function toggleCuisine(c: string) {
    setSelectedCuisines((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  const filtered = sites.filter((s) => {
    if (cityQuery.trim()) {
      const q = cityQuery.trim().toLowerCase();
      if (!s.city || !s.city.toLowerCase().includes(q)) return false;
    }
    if (selectedCuisines.size > 0 && !selectedCuisines.has(s.category)) return false;
    if (s.priceRange) {
      if (s.priceRange.max < minPrice || s.priceRange.min > maxPrice) return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>
      <Logo />
      <h1 style={{ fontSize: 28, margin: '0 0 4px' }}>
        {data.listName ? `Comer desde "${data.listName}"` : 'Tus sitios para comer'}
      </h1>
      <p style={{ fontSize: 14, color: '#5c6650', margin: '0 0 20px' }}>
        Mostrando {filtered.length} de {data.gastronomicCount} restaurantes
        {data.totalSitesFound ? ` (de ${data.totalSitesFound} sitios en tu lista)` : ''}.
      </p>

      {data.partial && (
        <div
          style={{
            background: '#fbead9',
            border: '1px solid #e8c79a',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          Tu lista es grande: hemos procesado lo que nos ha dado tiempo. Vuelve a intentarlo si
          quieres verla completa.
        </div>
      )}

      <div
        style={{
          background: '#fffef8',
          border: '1px solid var(--card-border)',
          borderRadius: 16,
          padding: '18px 18px 8px',
          marginBottom: 24,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Ciudad
          </label>
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="Ej. Madrid"
            style={{
              width: '100%',
              padding: '9px 12px',
              fontSize: 14,
              borderRadius: 8,
              border: '1.5px solid var(--card-border)',
              background: '#fff',
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Precio: {minPrice}€ – {maxPrice}€
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
              style={{ flex: 1, accentColor: 'var(--olive-leaf)' }}
            />
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
              style={{ flex: 1, accentColor: 'var(--olive-leaf)' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Tipo de cocina
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cuisines.map((c) => {
              const active = selectedCuisines.has(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 13,
                    border: `1.5px solid ${active ? 'var(--olive-leaf-dark)' : 'var(--card-border)'}`,
                    background: active ? 'var(--olive-leaf)' : '#fff',
                    color: active ? '#fdf7e2' : 'var(--black-forest)',
                    cursor: 'pointer',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            background: '#fffef8',
            border: '1px solid var(--card-border)',
            borderRadius: 16,
            padding: '28px 20px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 16, margin: '0 0 6px' }}>Con esos filtros no hay nada.</p>
          <p style={{ fontSize: 14, color: '#5c6650', margin: 0 }}>
            Prueba a ampliar el rango de precio o quitar algún filtro de cocina.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((site) => (
            <a
              key={site.id}
              href={site.mapsUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textDecoration: 'none',
                background: '#fffef8',
                border: '1px solid var(--card-border)',
                borderRadius: 14,
                padding: '14px 16px',
                cursor: site.mapsUrl ? 'pointer' : 'default',
                opacity: site.mapsUrl ? 1 : 0.6,
                pointerEvents: site.mapsUrl ? 'auto' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--black-forest)' }}>
                    {site.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#5c6650', marginTop: 2 }}>
                    {site.category}
                    {site.rating != null ? ` · ${site.rating}★${site.reviewCount ? ` (${site.reviewCount})` : ''}` : ''}
                  </div>
                  {site.note && (
                    <div style={{ fontSize: 12, color: '#8a7f5e', marginTop: 4, fontStyle: 'italic' }}>
                      {site.note}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--olive-leaf-dark)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {priceLabel(site)}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <button
        onClick={onRetry}
        style={{
          marginTop: 28,
          background: 'none',
          border: 'none',
          color: 'var(--olive-leaf-dark)',
          fontSize: 13,
          textDecoration: 'underline',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Probar con otra lista
      </button>
    </div>
  );
}
