import InspectorPanel from '../ui/InspectorPanel';
import { QrCode, ShieldAlert, Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CopyButton from '../ui/CopyButton';

const QRCodeInspector = ({ isOpen, onClose, qrData, recoveryCodes = [] }) => {
  const { t } = useTranslation();

  return (
    <InspectorPanel
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.start2FASetup')}
      subtitle={t('settings.step1ScanQr')}
      icon={QrCode}
      width="460px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {t('settings.step1ScanQr')}
        </p>

        {qrData?.qrCodeDataUrl && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              padding: '1rem', background: 'white',
              borderRadius: '8px', border: '2px solid var(--color-surface-border)',
              boxShadow: 'var(--shadow-card)',
              display: 'inline-flex',
            }}>
              <img src={qrData.qrCodeDataUrl} alt="QR" width={200} height={200} />
            </div>
          </div>
        )}

        {recoveryCodes.length > 0 && (
          <div style={{ background: 'var(--color-amber-light)', borderRadius: '6px', padding: '1rem', border: '1px solid #FFE699' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-amber-hover)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <ShieldAlert size={16} /> {t('login.recoveryTitle')}
              </span>
              <CopyButton text={recoveryCodes.join('\n')} label={t('common.copy')} size="sm" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.375rem' }}>
              {recoveryCodes.map((code, i) => (
                <span key={i} style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700,
                  padding: '0.375rem 0.5rem',
                  background: 'white', borderRadius: '4px',
                  border: '1px solid var(--color-amber)',
                  color: 'var(--color-text-primary)',
                  letterSpacing: '0.1em',
                }}>
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </InspectorPanel>
  );
};

export default QRCodeInspector;
