import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CopyButton from './CopyButton';

const SecretField = ({ value, label, mono = true }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const displayValue = visible ? value : '•'.repeat(Math.min(value?.length || 32, 48));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {label && (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 0.75rem',
        background: '#F8FAFC',
        borderRadius: '4px',
        border: '1px solid var(--color-surface-border)',
      }}>
        <span style={{
          flex: 1,
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          fontSize: '0.8125rem',
          color: 'var(--color-text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          wordBreak: 'break-all',
        }}>
          {displayValue}
        </span>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          title={visible ? t('common.hide') : t('common.show')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', padding: '2px',
            display: 'flex', alignItems: 'center',
          }}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        {visible && <CopyButton text={value} label={t('common.copy')} />}
      </div>
    </div>
  );
};

export default SecretField;
