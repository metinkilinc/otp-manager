import { useState } from 'react';
import { Lightbulb, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * HelpInfoBanner — Ekran görüntüsündeki üst sarı bilgilendirme kutusu.
 * "💡 Bu Sayfa Ne İşe Yarar?" başlığı ve genişletilebilir açıklama maddeleri.
 */
const HelpInfoBanner = ({ title, items = [] }) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(true);

  const displayTitle = title || t('dashboard.bannerTitle');

  if (!items || items.length === 0) return null;

  return (
    <div className="info-banner-yellow" style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.875rem' }}>
          <Lightbulb size={18} color="#D97706" />
          <span>{displayTitle}</span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#92400E', fontSize: '0.75rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.25rem',
          }}
        >
          {collapsed ? t('common.show') : t('common.hide')}
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #FDE68A', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', lineHeight: 1.5 }}>
              <Star size={14} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpInfoBanner;
