import { Info, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * GuidanceSidebar — Ekran görüntüsündeki sağ bilgilendirme notları kolonu (%30 genişlik).
 * Formların ve verilerin sağ tarafında kılavuz, önemli notlar, numaralı adımlar ve aksiyon butonları sunar.
 */
const GuidanceSidebar = ({
  guideTitle,
  guideText,
  warningTitle,
  warningText,
  steps = [],
  onSubmit,
  submitLabel,
  submitLoading = false,
  onSecondary,
  secondaryLabel,
}) => {
  const { t } = useTranslation();

  const displayGuideTitle = guideTitle || t('dashboard.guideTitle');
  const displayGuideText = guideText || t('dashboard.guideText');
  const displayWarningTitle = warningTitle || t('dashboard.warningTitle');
  const displayWarningText = warningText || t('dashboard.warningText');
  const displaySubmitLabel = submitLabel || t('common.confirm');
  const displaySecondaryLabel = secondaryLabel || t('common.save');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* ℹ️ Başvuru Kılavuzu */}
      {displayGuideText && (
        <div className="guide-box-blue">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.375rem' }}>
            <Info size={16} color="#1E40AF" />
            <span>{displayGuideTitle}</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.5, color: '#1E3A8A' }}>
            {displayGuideText}
          </p>
        </div>
      )}

      {/* ⚠️ Önemli Not Kutusu */}
      {displayWarningText && (
        <div className="warning-box-yellow">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.375rem' }}>
            <AlertTriangle size={16} color="#D97706" />
            <span>{displayWarningTitle}</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.5, color: '#78350F' }}>
            {displayWarningText}
          </p>
        </div>
      )}

      {/* 💜 Numaralandırılmış Süreç Adımları (1, 2, 3, 4) */}
      {steps && steps.length > 0 && (
        <div className="step-box-purple">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>
            <span>💜 {t('dashboard.completionSteps')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                <span className="step-number-badge">{idx + 1}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aksiyon Butonları */}
      {onSubmit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onSubmit}
            className="btn-success"
            disabled={submitLoading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem' }}
          >
            🚀 {submitLoading ? t('common.loading') : displaySubmitLabel}
          </button>

          {onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.625rem', fontSize: '0.8125rem' }}
            >
              💾 {displaySecondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GuidanceSidebar;
