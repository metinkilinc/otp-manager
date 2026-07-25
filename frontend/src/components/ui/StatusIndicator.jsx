const StatusIndicator = ({ active, size = 'md', showLabel = false }) => {
  const sizes = { sm: 8, md: 10, lg: 14 };
  const px = sizes[size] || 10;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <span
          style={{
            width: px, height: px,
            borderRadius: '9999px',
            backgroundColor: active ? 'var(--color-emerald)' : 'var(--color-surface-border)',
            display: 'block',
          }}
        />
        {active && (
          <span
            className="animate-pulse-2fa"
            style={{
              position: 'absolute', inset: 0,
              borderRadius: '9999px',
              backgroundColor: 'var(--color-emerald)',
              opacity: 0.6,
            }}
          />
        )}
      </span>
      {showLabel && (
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: active ? 'var(--color-emerald)' : 'var(--color-text-muted)',
        }}>
          {active ? 'Aktif' : 'Pasif'}
        </span>
      )}
    </span>
  );
};

export default StatusIndicator;
