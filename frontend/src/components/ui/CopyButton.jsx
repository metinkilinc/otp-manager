import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const CopyButton = ({ text, label, size = 'sm' }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const displayLabel = label || t('common.copy');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t('toasts.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('toasts.errorOccurred'));
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={displayLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: size === 'sm' ? '0.375rem 0.75rem' : '0.5rem 1rem',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: copied ? 'var(--color-emerald-light)' : '#EDF2F7',
        color: copied ? 'var(--color-emerald)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 600,
        transition: 'all 0.2s',
        fontFamily: 'inherit',
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? t('common.copied') : displayLabel}
    </button>
  );
};

export default CopyButton;
