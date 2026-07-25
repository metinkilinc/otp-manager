import { useState } from 'react';
import { Terminal, Send, Copy, Check, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import toast from 'react-hot-toast';

const ApiPlaygroundWidget = ({ apiKey = 'live_demo_key_9988' }) => {
  const { t } = useTranslation();
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/v1/enroll/start');
  const [userId, setUserId] = useState('usr_test_100');
  const [responseLog, setResponseLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunRequest = async () => {
    setLoading(true);
    setResponseLog(null);
    try {
      if (selectedEndpoint === '/api/v1/enroll/start') {
        const res = await api.post('/enroll/start', {
          externalUserId: userId,
          userEmail: `${userId}@bel.tr`,
        });
        setResponseLog({ status: res.status, data: res.data });
        toast.success(t('toasts.savedSuccess'));
      } else if (selectedEndpoint === '/api/v1/status') {
        const res = await api.get(`/status?externalUserId=${userId}`);
        setResponseLog({ status: res.status, data: res.data });
        toast.success(t('toasts.savedSuccess'));
      }
    } catch (err) {
      setResponseLog({
        status: err.response?.status || 500,
        data: err.response?.data || { error: t('toasts.errorOccurred') },
      });
      toast.error(t('toasts.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (responseLog) {
      navigator.clipboard.writeText(JSON.stringify(responseLog, null, 2));
      setCopied(true);
      toast.success(t('toasts.copied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card" style={{ borderTop: '3px solid var(--color-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '1.75rem', height: '1.75rem', borderRadius: '4px',
            background: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-primary)',
          }}>
            <Terminal size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
            {t('dashboard.apiPlayground')}
          </span>
        </div>
        <span className="badge-info">Playground</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Endpoint Seçimi & Input */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
              Endpoint
            </label>
            <select
              className="input"
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.6rem' }}
            >
              <option value="/api/v1/enroll/start">POST /enroll/start</option>
              <option value="/api/v1/status">GET /status</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
              {t('dashboard.userEmailLabel')}
            </label>
            <input
              className="input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', padding: '0.4rem 0.6rem' }}
              placeholder="usr_100"
            />
          </div>
        </div>

        {/* Çalıştır Butonu */}
        <button
          type="button"
          onClick={handleRunRequest}
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '0.5rem', fontSize: '0.8125rem' }}
        >
          <Send size={14} /> {loading ? t('common.loading') : t('dashboard.sendRequest')}
        </button>

        {/* Canlı Yanıt Çıktısı (JSON Terminal Görünümü) */}
        {responseLog && (
          <div style={{
            background: '#1E1E2E',
            borderRadius: '4px',
            padding: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: '#A6ACCD',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>
              <span style={{ color: responseLog.status === 200 ? '#50CD89' : '#F1416C', fontWeight: 700 }}>
                Status: {responseLog.status} OK
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: copied ? '#50CD89' : '#A6ACCD', fontSize: '0.6875rem',
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <pre style={{ margin: 0, overflowX: 'auto', maxHeight: '140px', lineHeight: 1.4 }}>
              {JSON.stringify(responseLog.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiPlaygroundWidget;
