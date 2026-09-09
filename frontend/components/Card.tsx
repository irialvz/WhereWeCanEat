export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fffef8',
        border: '1px solid var(--card-border)',
        borderRadius: 20,
        padding: '32px 28px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 2px 0 rgba(31,42,23,0.04)',
      }}
    >
      {children}
    </div>
  );
}
