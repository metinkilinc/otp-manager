import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * PageHeaderBar — Ekran görüntüsündeki sayfa başlık çubuğu.
 * Sol tarafta simge + başlık + açıklama, sağ tarafta optional "← Geri Dön" butonu.
 */
const PageHeaderBar = ({ icon: Icon, title, description, backTo = null, backLabel }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const defaultBackLabel = backLabel || t('common.back');

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem',
      borderBottom: '1px solid var(--color-surface-border)',
      marginBottom: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {Icon && (
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '4px',
            background: '#FEF3C7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#D97706',
            flexShrink: 0,
          }}>
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {title}
          </h1>
          {description && (
            <p style={{ margin: '0.125rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
              {description}
            </p>
          )}
        </div>
      </div>

      {backTo && (
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
        >
          <ArrowLeft size={16} /> {defaultBackLabel}
        </button>
      )}
    </div>
  );
};

export default PageHeaderBar;
