'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  cuisines: string[];
  selected: Set<string>;
  onToggle: (cuisine: string) => void;
};

// Con pocos tipos de cocina los chips caben bien en línea; con listas grandes (muchas
// cocinas distintas) los agrupamos detrás de un botón para no desbordar el panel de
// filtros.
const POPOVER_THRESHOLD = 8;

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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
      {label}
    </button>
  );
}

export default function CuisineFilter({ cuisines, selected, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (cuisines.length <= POPOVER_THRESHOLD) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {cuisines.map((c) => (
          <Chip key={c} label={c} active={selected.has(c)} onClick={() => onToggle(c)} />
        ))}
      </div>
    );
  }

  const count = selected.size;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '8px 14px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          border: `1.5px solid ${count > 0 ? 'var(--olive-leaf-dark)' : 'var(--card-border)'}`,
          background: count > 0 ? 'var(--olive-leaf)' : '#fff',
          color: count > 0 ? '#fdf7e2' : 'var(--black-forest)',
          cursor: 'pointer',
        }}
      >
        Tipo de cocina{count > 0 ? ` (${count})` : ''} {open ? '▲' : '▼'}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 10,
            background: '#fffef8',
            border: '1px solid var(--card-border)',
            borderRadius: 14,
            boxShadow: '0 8px 24px rgba(31,42,23,0.15)',
            padding: 14,
            width: 320,
            maxWidth: '80vw',
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {/* Flecha del bocadillo */}
          <div
            style={{
              position: 'absolute',
              top: -7,
              left: 20,
              width: 12,
              height: 12,
              background: '#fffef8',
              borderLeft: '1px solid var(--card-border)',
              borderTop: '1px solid var(--card-border)',
              transform: 'rotate(45deg)',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative' }}>
            {cuisines.map((c) => (
              <Chip key={c} label={c} active={selected.has(c)} onClick={() => onToggle(c)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
