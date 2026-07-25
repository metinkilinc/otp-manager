const colorMap = {
  teal: 'stat-card-teal',
  primary: 'stat-card-primary',
  emerald: 'stat-card-emerald',
  rose: 'stat-card-rose',
  ocean: 'stat-card-ocean',
  amber: 'stat-card-amber',
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary', loading = false }) => {
  return (
    <div className={colorMap[color] || 'stat-card-primary'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{
          padding: '0.5rem',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '0.75rem',
          display: 'flex',
        }}>
          <Icon size={20} color="white" />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '0.25rem' }}>
        {loading ? (
          <div style={{ width: 60, height: 32, background: 'rgba(255,255,255,0.3)', borderRadius: '0.5rem', animation: 'pulse 1.5s infinite' }} />
        ) : value}
      </div>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '0.125rem' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{subtitle}</div>
      )}
    </div>
  );
};

export default StatCard;
