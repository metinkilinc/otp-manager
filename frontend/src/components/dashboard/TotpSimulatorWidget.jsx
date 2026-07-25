import { useState, useEffect } from 'react';
import { ShieldCheck, Play, Copy, Check } from 'lucide-react';
import { TOTP, Secret } from 'otpauth';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const TotpSimulatorWidget = ({ defaultSecret = 'JBSWY3DPEHPK3PXP' }) => {
  const { t } = useTranslation();
  const [secretStr, setSecretStr] = useState(defaultSecret);
  const [currentCode, setCurrentCode] = useState('------');
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [testCode, setTestCode] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateTOTP = () => {
      try {
        const cleanSecret = secretStr.replace(/\s+/g, '').toUpperCase();
        if (!cleanSecret) return;
        
        const totp = new TOTP({
          secret: Secret.fromBase32(cleanSecret),
          digits: 6,
          period: 30,
        });

        const code = totp.generate();
        setCurrentCode(code);

        const now = Math.floor(Date.now() / 1000);
        const remaining = 30 - (now % 30);
        setSecondsLeft(remaining);
      } catch {
        setCurrentCode(t('common.error').toUpperCase());
      }
    };

    updateTOTP();
    const interval = setInterval(updateTOTP, 1000);
    return () => clearInterval(interval);
  }, [secretStr, t]);

  const handleCopyCode = () => {
    if (currentCode && currentCode !== t('common.error').toUpperCase()) {
      navigator.clipboard.writeText(currentCode);
      setCopied(true);
      toast.success(t('toasts.copied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestVerify = () => {
    try {
      const cleanSecret = secretStr.replace(/\s+/g, '').toUpperCase();
      const totp = new TOTP({
        secret: Secret.fromBase32(cleanSecret),
        digits: 6,
        period: 30,
      });

      const delta = totp.validate({ token: testCode, window: 1 });
      if (delta !== null) {
        setTestResult({ success: true, message: t('dashboard.testSuccess') });
      } else {
        setTestResult({ success: false, message: t('dashboard.testFailed') });
      }
    } catch {
      setTestResult({ success: false, message: t('dashboard.testFailed') });
    }
  };

  const strokeDashoffset = 113.1 - (113.1 * secondsLeft) / 30;

  return (
    <div className="card" style={{ borderTop: '3px solid var(--color-purple)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '1.75rem', height: '1.75rem', borderRadius: '4px',
            background: 'var(--color-purple-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-purple)',
          }}>
            <ShieldCheck size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
            {t('dashboard.liveTOTPSimulator')}
          </span>
        </div>
        <span className="badge-purple">Live 30s</span>
      </div>

      {/* Canlı Kod Gösterge Kutusu */}
      <div style={{
        background: '#1E1E2E',
        borderRadius: '4px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        color: 'white',
        marginBottom: '1rem',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
      }}>
        <div>
          <span style={{ fontSize: '0.6875rem', color: '#A6ACCD', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('dashboard.liveVerificationCode')}
          </span>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.15em',
            color: '#50CD89',
            marginTop: '0.125rem',
          }}>
            {currentCode.slice(0, 3)} {currentCode.slice(3)}
          </div>
        </div>

        {/* 30 Saniyelik Dairesel Geri Sayım Zamanlayıcısı */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ position: 'relative', width: 44, height: 44 }}>
            <svg width={44} height={44}>
              <circle
                cx={22} cy={22} r={18}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={4}
                fill="transparent"
              />
              <circle
                className="totp-timer-ring"
                cx={22} cy={22} r={18}
                stroke={secondsLeft <= 5 ? '#F1416C' : '#3E97FF'}
                strokeWidth={4}
                fill="transparent"
                strokeDasharray={113.1}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
              color: secondsLeft <= 5 ? '#F1416C' : 'white',
            }}>
              {secondsLeft}s
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: copied ? '#50CD89' : '#A6ACCD', fontSize: '0.6875rem',
              display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600,
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
      </div>

      {/* Secret Input & Test */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
            Base32 TOTP Secret Key
          </label>
          <input
            className="input"
            value={secretStr}
            onChange={(e) => setSecretStr(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
            placeholder="JBSWY3DPEHPK3PXP"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
            {t('dashboard.testVerification')}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="input"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', textAlign: 'center', letterSpacing: '0.1em' }}
            />
            <button
              type="button"
              onClick={handleTestVerify}
              className="btn-purple"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
            >
              <Play size={14} /> {t('dashboard.testBtn')}
            </button>
          </div>
        </div>

        {testResult && (
          <div style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
            backgroundColor: testResult.success ? 'var(--color-emerald-light)' : 'var(--color-danger-light)',
            color: testResult.success ? 'var(--color-emerald)' : 'var(--color-danger)',
          }}>
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TotpSimulatorWidget;
