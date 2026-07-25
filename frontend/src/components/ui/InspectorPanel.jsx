import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * InspectorPanel — Zero-Modal sağ panel / drawer.
 * Modal pencereleri tamamen kaldırıp yerine kurumsal sağ detay/işlem paneli sunar.
 */
const InspectorPanel = ({ isOpen, onClose, title, subtitle, icon: Icon, children, width = '440px' }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          backgroundColor: 'rgba(24, 28, 50, 0.35)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
      />

      {/* Right Drawer Inspector Panel */}
      <aside
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: width,
          maxWidth: '100vw',
          backgroundColor: 'white',
          borderLeft: '1px solid var(--color-surface-border)',
          boxShadow: 'var(--shadow-drawer)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-surface-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAFAFC',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {Icon && (
              <div style={{
                width: '2.25rem', height: '2.25rem',
                borderRadius: '4px',
                background: 'var(--color-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-primary-text)',
              }}>
                <Icon size={18} />
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {title}
              </h3>
              {subtitle && (
                <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '0.375rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
            title={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {children}
        </div>
      </aside>
    </>
  );
};

export default InspectorPanel;
