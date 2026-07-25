import Modal from '../ui/Modal';
import { useTranslation } from 'react-i18next';

const QRCodeModal = ({ isOpen, onClose, qrData, recoveryCodes = [] }) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('settings.start2FASetup')} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {t('settings.step1ScanQr')}
        </p>

        {qrData?.qrCodeDataUrl && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              padding: '1rem', background: 'white',
              borderRadius: '1rem', border: '2px solid var(--color-surface-border)',
              boxShadow: 'var(--shadow-card)',
              display: 'inline-flex',
            }}>
              <img src={qrData.qrCodeDataUrl} alt="QR" width={200} height={200} />
            </div>
          </div>
        )}

        {recoveryCodes.length > 0 && (
          <div style={{ background: 'var(--color-amber-light)', borderRadius: '0.75rem', padding: '1rem' }}>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-amber)' }}>
              {t('settings.saveBackupCodesNotice')}
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.375rem',
            }}>
              {recoveryCodes.map((code, i) => (
                <span key={i} style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600,
                  padding: '0.375rem 0.5rem',
                  background: 'white', borderRadius: '0.5rem',
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

        <button type="button" onClick={onClose} className="btn-primary" style={{ marginTop: '0.5rem' }}>
          {t('common.confirm')}
        </button>
      </div>
    </Modal>
  );
};

export default QRCodeModal;
