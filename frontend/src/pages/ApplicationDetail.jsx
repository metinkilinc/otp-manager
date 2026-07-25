import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, KeyRound, Smartphone, ShieldCheck, Play, Bot, Sparkles, Code2, Users, FileText, Settings, Shield, ShieldAlert, Network, Plus, X, Webhook, Sliders, Package } from 'lucide-react';
import { TOTP, Secret } from 'otpauth';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Toggle from '../components/ui/Toggle';
import IntegrationGuide from '../components/applications/IntegrationGuide';
import AiPromptGenerator from '../components/applications/AiPromptGenerator';
import SdkGuide from '../components/applications/SdkGuide';
import EnrollmentTable from '../components/enrollments/EnrollmentTable';
import HelpInfoBanner from '../components/ui/HelpInfoBanner';
import GuidanceSidebar from '../components/ui/GuidanceSidebar';
import PageHeaderBar from '../components/ui/PageHeaderBar';
import OTPInput from '../components/ui/OTPInput';
import api from '../api/client';
import toast from 'react-hot-toast';

// SEKMELER (Key-based)
const TABS = [
  { key: 'integration', labelKey: 'applicationDetail.tabIntegrationGuide' },
  { key: 'sdk', labelKey: 'applicationDetail.tabSdkSetup' },
  { key: 'users', labelKey: 'applicationDetail.tabUsers' },
  { key: 'settings', labelKey: 'applicationDetail.tabSettings' },
  { key: 'logs', labelKey: 'applicationDetail.tabAuditLogs' },
  { key: 'ai', labelKey: 'applicationDetail.tabAiPrompt' },
];

// SAĞ KOLON İÇİN CANLI QR KODU SANDBOX KARTI
function LiveQRSandboxCard({ app }) {
  const { t } = useTranslation();
  const [testCode, setTestCode] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const demoSecretBase32 = 'JBSWY3DPEHPK3PXP';
  const otpauthUrl = `otpauth://totp/OTP%20Manager:${app?.slug || 'test'}?secret=${demoSecretBase32}&issuer=OTP%20Manager`;
  const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(otpauthUrl)}`;

  const handleVerifyTest = () => {
    if (testCode.length !== 6) {
      toast.error(t('applicationDetail.enter6Digits'));
      return;
    }
    setLoading(true);
    try {
      const totp = new TOTP({
        secret: Secret.fromBase32(demoSecretBase32),
        digits: 6,
        period: 30,
      });

      const delta = totp.validate({ token: testCode, window: 1 });
      if (delta !== null) {
        setTestResult({
          success: true,
          message: t('applicationDetail.testSuccessToast'),
        });
        toast.success(t('applicationDetail.testSuccessToast'));
      } else {
        setTestResult({
          success: false,
          message: t('applicationDetail.testFailedToast'),
        });
        toast.error(t('applicationDetail.testFailedToast'));
      }
    } catch {
      setTestResult({ success: false, message: t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ borderTop: '4px solid #10B981', background: '#F0FDF4', padding: '1rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <ShieldCheck size={20} color="#10B981" className="shrink-0" />
        <div>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#065F46' }}>
            {t('applicationDetail.sandboxTitle')}
          </h3>
          <span style={{ fontSize: '0.6875rem', color: '#047857' }}>
            {t('applicationDetail.sandboxSubtitle')}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {/* QR Kod Görseli */}
        <div style={{
          background: 'white', padding: '0.875rem', borderRadius: '4px', border: '1px solid #A7F3D0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>
            {t('applicationDetail.sandboxStep1')}
          </span>
          <div style={{ padding: '0.375rem', background: 'white', border: '2px solid #34D399', borderRadius: '4px' }}>
            <img src={qrCodeDataUrl} alt="QR" width={130} height={130} />
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#4A5568', fontFamily: 'var(--font-mono)' }}>
            Base32: {demoSecretBase32}
          </span>
        </div>

        {/* Kod Girişi & Test Butonu */}
        <div style={{
          background: 'white', padding: '0.875rem', borderRadius: '4px', border: '1px solid #A7F3D0',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>
            {t('applicationDetail.sandboxStep2')}
          </span>

          <OTPInput value={testCode} onChange={setTestCode} size="sm" />

          <button
            type="button"
            onClick={handleVerifyTest}
            className="btn-success"
            disabled={loading || testCode.length !== 6}
            style={{ width: '100%', justifyContent: 'center', padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}
          >
            <Play size={14} /> {loading ? t('common.loading') : t('applicationDetail.verifyTestBtn')}
          </button>

          {testResult && (
            <div style={{
              padding: '0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 800,
              backgroundColor: testResult.success ? '#D1FAE5' : '#FEE2E2',
              color: testResult.success ? '#065F46' : '#991B1B',
              border: testResult.success ? '1px solid #A7F3D0' : '1px solid #FCA5A5',
            }}>
              {testResult.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState('integration');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchApp = async () => {
    try {
      const { data } = await api.get(`/admin/applications/${id}`);
      if (!data.data.application) { navigate('/apps'); return; }
      setApp(data.data.application);
    } catch { toast.error(t('applicationDetail.fetchFailed')); }
    finally { setLoading(false); }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const { data } = await api.get(`/audit-logs?appId=${id}&limit=50`);
      setLogs(data.data.logs || []);
    } catch {}
    finally { setLogsLoading(false); }
  };

  useEffect(() => { fetchApp(); }, [id]);
  useEffect(() => { if (activeTabKey === 'logs') fetchLogs(); }, [activeTabKey]);

  const handleToggleActive = async (value) => {
    try {
      await api.put(`/admin/applications/${id}`, { isActive: value });
      setApp((a) => ({ ...a, isActive: value }));
      toast.success(value ? t('applicationDetail.appActivated') : t('applicationDetail.appDisabled'));
    } catch { toast.error(t('applicationDetail.operationFailed')); }
  };

  const handleToggleForce2FA = async (value) => {
    try {
      await api.put(`/admin/applications/${id}`, { force2FA: value });
      setApp((a) => ({ ...a, force2FA: value }));
      toast.success(t('applicationDetail.force2FAUpdated'));
    } catch { toast.error(t('applicationDetail.operationFailed')); }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/applications/${id}`);
      toast.success(t('applicationDetail.appDeleted'));
      navigate('/apps');
    } catch (err) {
      toast.error(t('applicationDetail.deleteFailed'));
      console.error('[handleDelete]', err);
    }
  };

  // ─── IP Whitelist ───
  const [ipInput, setIpInput] = useState('');
  const [ipLoading, setIpLoading] = useState(false);

  const handleAddIps = async () => {
    const trimmed = ipInput.trim();
    if (!trimmed) return;
    setIpLoading(true);
    try {
      const { data } = await api.post(`/admin/applications/${id}/whitelist`, { ips: trimmed });
      setApp((a) => ({ ...a, allowedIps: data.data.allowedIps }));
      setIpInput('');
      toast.success(t('applicationDetail.ipAdded'));
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || t('applicationDetail.ipAddFailed'));
    } finally {
      setIpLoading(false);
    }
  };

  const handleRemoveIp = async (ip) => {
    try {
      const { data } = await api.delete(`/admin/applications/${id}/whitelist`, { data: { ip } });
      setApp((a) => ({ ...a, allowedIps: data.data.allowedIps }));
      toast.success(t('applicationDetail.ipRemoved', { ip }));
    } catch {
      toast.error(t('applicationDetail.ipRemoveFailed'));
    }
  };

  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  const handleRegenerateKey = async () => {
    try {
      const { data } = await api.post(`/admin/applications/${id}/regenerate-key`);
      setApp(data.data.application);
      toast.success(t('applicationDetail.apiKeysRenewed'));
      setShowRegenConfirm(false);
    } catch (err) {
      toast.error(t('applicationDetail.keyRenewFailed'));
      console.error('[handleRegenerateKey]', err);
    }
  };

  // ─── Webhook Yönetimi ───
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookLoading, setWebhookLoading] = useState(false);

  useEffect(() => {
    if (app) {
      setWebhookUrl(app.webhookUrl || '');
      setWebhookSecret(app.webhookSecret || '');
      setRlMax(app.rateLimitMaxRequests ?? 100);
      setRlWindow(Math.round((app.rateLimitWindowMs ?? 60000) / 1000));
    }
  }, [app?.id]);

  const handleSaveWebhook = async () => {
    setWebhookLoading(true);
    try {
      await api.put(`/admin/applications/${id}`, {
        webhookUrl: webhookUrl.trim() || null,
        webhookSecret: webhookSecret.trim() || null,
      });
      setApp((a) => ({ ...a, webhookUrl: webhookUrl.trim() || null, webhookSecret: webhookSecret.trim() || null }));
      toast.success(t('applicationDetail.webhookSaved'));
    } catch {
      toast.error(t('applicationDetail.webhookSaveFailed'));
    } finally {
      setWebhookLoading(false);
    }
  };

  // ─── Rate Limiting ───
  const [rlMax, setRlMax] = useState(100);
  const [rlWindow, setRlWindow] = useState(60);
  const [rlLoading, setRlLoading] = useState(false);

  const handleSaveRateLimit = async () => {
    setRlLoading(true);
    try {
      await api.put(`/admin/applications/${id}`, {
        rateLimitMaxRequests: parseInt(rlMax, 10),
        rateLimitWindowMs: parseInt(rlWindow, 10) * 1000,
      });
      setApp((a) => ({ ...a, rateLimitMaxRequests: parseInt(rlMax, 10), rateLimitWindowMs: parseInt(rlWindow, 10) * 1000 }));
      toast.success(t('applicationDetail.rateLimitSaved'));
    } catch {
      toast.error(t('applicationDetail.rateLimitSaveFailed'));
    } finally {
      setRlLoading(false);
    }
  };

  const actionLabels = {
    ENROLL_START: t('auditLog.actions.ENROLL_START'),
    ENROLL_VERIFY: t('auditLog.actions.ENROLL_VERIFY'),
    TOTP_VERIFY_SUCCESS: t('auditLog.actions.TOTP_VERIFY_SUCCESS'),
    TOTP_VERIFY_FAIL: t('auditLog.actions.TOTP_VERIFY_FAIL'),
    TOTP_ENABLE: t('auditLog.actions.TOTP_ENABLE'),
    TOTP_DISABLE: t('auditLog.actions.TOTP_DISABLE'),
    TOTP_RESET: t('auditLog.actions.TOTP_RESET'),
    RECOVERY_USED: t('auditLog.actions.RECOVERY_USED'),
    ACCOUNT_LOCKED: t('auditLog.actions.ACCOUNT_LOCKED'),
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '4px', border: '3px solid var(--color-primary-light)', borderTop: '3px solid var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!app) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
      <PageHeaderBar
        icon={Smartphone}
        title={app.name}
        description={t('applicationDetail.pageDesc', { slug: app.slug, count: app.activeEnrollments || 0 })}
        backTo="/apps"
        backLabel={t('applicationDetail.backToApps')}
      />

      <HelpInfoBanner
        title={t('applicationDetail.bannerTitle')}
        items={[
          t('applicationDetail.bannerItem1'),
          t('applicationDetail.bannerItem2'),
          t('applicationDetail.bannerItem3'),
        ]}
      />

      {/* SEKMELER MENÜSÜ */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', overflowX: 'auto' }}>
        {TABS.map((tItem) => {
          const isSdkTab = tItem.key === 'sdk';
          const isAiTab = tItem.key === 'ai';
          const isSelected = activeTabKey === tItem.key;
          return (
            <button
              key={tItem.key}
              type="button"
              onClick={() => setActiveTabKey(tItem.key)}
              style={{
                padding: '0.75rem 1.125rem',
                border: 'none',
                borderBottom: isSelected ? '3px solid #3182CE' : '3px solid transparent',
                background: isSdkTab && isSelected ? '#EBF8FF' : isAiTab && isSelected ? '#EDE9FE' : isAiTab ? '#F5F3FF' : 'none',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: isSelected ? 800 : 600,
                color: isSdkTab ? '#2B6CB0' : isAiTab ? '#7C3AED' : isSelected ? '#2B6CB0' : '#4A5568',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              {isSdkTab && <Package size={16} color="#3182CE" />}
              {isAiTab && <Sparkles size={16} color="#7C3AED" />}
              <span>{t(tItem.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* EĞER SDK KURULUMU VEYA AI ENTEGRASYON PROMPTU SEKMESİ SEÇİLİYSE: GENİŞ FULL-WIDTH DÜZEN */}
      {activeTabKey === 'sdk' ? (
        <div style={{ width: '100%' }}>
          <SdkGuide app={app} />
        </div>
      ) : activeTabKey === 'ai' ? (
        <div style={{ width: '100%' }}>
          <AiPromptGenerator app={app} />
        </div>
      ) : (
        /* DİĞER SEKMELER İÇİN SIDE-BY-SIDE DÜZEN */
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          
          {/* SOL KOLON (%68 GENİŞLİK — UYGULAMA İÇERİĞİ) */}
          <div style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Header Card */}
            <div className="card" style={{ borderLeft: '4px solid #3182CE' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>{app.name}</h2>
                    <Badge type={app.isActive ? 'active' : 'inactive'} showDot>
                      {app.isActive ? t('applicationDetail.activeIntegration') : t('applicationDetail.disabled')}
                    </Badge>
                    {app.force2FA && <Badge type="purple">{t('applications.mandatory2FA')}</Badge>}
                  </div>
                  {app.domain && <div style={{ fontSize: '0.8125rem', color: '#718096', fontFamily: 'var(--font-mono)' }}>🌐 {app.domain}</div>}
                </div>

                {user?.role === 'SUPER_ADMIN' && !showDeleteConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn-danger"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
                  >
                    <Trash2 size={14} /> {t('applicationDetail.deleteApp')}
                  </button>
                )}
                {user?.role === 'SUPER_ADMIN' && showDeleteConfirm && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#991B1B' }}>
                      {t('applicationDetail.confirmDelete')}
                    </span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.7rem', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}
                    >
                      {t('applicationDetail.yesDelete')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{ background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '4px', padding: '0.3rem 0.7rem', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Tab İçerikleri */}
            <div>
              {activeTabKey === 'integration' && (
                <IntegrationGuide app={app} />
              )}

              {activeTabKey === 'users' && (
                <div className="card">
                  <EnrollmentTable appId={id} />
                </div>
              )}

              {activeTabKey === 'settings' && user?.role === 'SUPER_ADMIN' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{t('applicationDetail.appStatus')}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{t('applicationDetail.appStatusDesc')}</div>
                    </div>
                    <Toggle checked={app.isActive} onChange={handleToggleActive} />
                  </div>

                  <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{t('applicationDetail.policy2FA')}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{t('applicationDetail.policy2FADesc')}</div>
                    </div>
                    <Toggle checked={app.force2FA} onChange={handleToggleForce2FA} />
                  </div>

                  {/* ─── IP WHITELIST YÖNETİMİ ─── */}
                  <div className="card" style={{ borderTop: '3px solid #3182CE' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Network size={18} color="#3182CE" />
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{t('applicationDetail.ipWhitelistTitle')}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                          {t('applicationDetail.ipWhitelistDesc')}
                        </div>
                      </div>
                    </div>

                    {/* Env durum bilgisi */}
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                      background: '#EFF6FF', border: '1px solid #BFDBFE',
                      borderRadius: '6px', padding: '0.625rem 0.75rem', marginBottom: '1rem',
                    }}>
                      <ShieldAlert size={15} color="#3B82F6" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                      <div style={{ fontSize: '0.75rem', color: '#1E40AF', lineHeight: 1.5 }}>
                        <strong>{t('applicationDetail.envNoticeTitle')}</strong> {t('applicationDetail.envNoticeDesc')}
                      </div>
                    </div>

                    {/* IP ekleme alanı */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
                      <input
                        id="ip-whitelist-input"
                        type="text"
                        value={ipInput}
                        onChange={(e) => setIpInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddIps()}
                        placeholder={t('applicationDetail.ipPlaceholder')}
                        style={{
                          flex: 1, padding: '0.5rem 0.75rem', border: '1.5px solid var(--color-surface-border)',
                          borderRadius: '6px', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)',
                          outline: 'none', background: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                      <button
                        id="ip-whitelist-add-btn"
                        type="button"
                        onClick={handleAddIps}
                        disabled={ipLoading || !ipInput.trim()}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.375rem',
                          background: '#3182CE', color: '#fff', border: 'none',
                          borderRadius: '6px', padding: '0.5rem 0.875rem',
                          fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer',
                          opacity: ipLoading || !ipInput.trim() ? 0.6 : 1,
                        }}
                      >
                        <Plus size={14} />
                        {ipLoading ? t('common.adding') : t('common.add')}
                      </button>
                    </div>

                    {/* Mevcut IP listesi */}
                    {(!app.allowedIps || app.allowedIps.length === 0) ? (
                      <div style={{
                        textAlign: 'center', padding: '1.25rem',
                        background: '#F8FAFC', border: '1px dashed #CBD5E0',
                        borderRadius: '6px', color: 'var(--color-text-muted)', fontSize: '0.8125rem',
                      }}>
                        <Shield size={20} style={{ marginBottom: '0.375rem', opacity: 0.4 }} />
                        <div>{t('applicationDetail.whitelistEmpty')}</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                          {t('applicationDetail.allowedIpsHeader', { count: app.allowedIps.length })}
                        </div>
                        {app.allowedIps.map((ip) => (
                          <div
                            key={ip}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.4rem 0.75rem',
                              background: '#F0FDF4', border: '1px solid #A7F3D0',
                              borderRadius: '6px',
                            }}
                          >
                            <code style={{ fontSize: '0.8125rem', color: '#065F46', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              {ip}
                            </code>
                            <button
                              id={`ip-remove-${ip.replace(/[./: ]/g, '-')}`}
                              type="button"
                              onClick={() => handleRemoveIp(ip)}
                              title={t('applicationDetail.removeIpTooltip')}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#DC2626', display: 'flex', alignItems: 'center',
                                padding: '0.125rem',
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ─── WEBHOOK YÖNETİMİ ─── */}
                  <div className="card" style={{ borderTop: '3px solid #7C3AED' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Webhook size={18} color="#7C3AED" />
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{t('applicationDetail.webhookTitle')}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                          {t('applicationDetail.webhookDesc')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '0.875rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4A5568', marginBottom: '0.375rem' }}>
                          {t('applicationDetail.webhookUrlLabel')}
                        </label>
                        <input
                          id="webhook-url-input"
                          type="url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder={t('applicationDetail.webhookUrlPlaceholder')}
                          style={{
                            width: '100%', padding: '0.5rem 0.75rem',
                            border: '1.5px solid var(--color-surface-border)', borderRadius: '6px',
                            fontSize: '0.8125rem', fontFamily: 'var(--font-mono)',
                            background: 'var(--color-surface)', color: 'var(--color-text-primary)',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4A5568', marginBottom: '0.375rem' }}>
                          {t('applicationDetail.webhookSecretLabel')}
                        </label>
                        <input
                          id="webhook-secret-input"
                          type="text"
                          value={webhookSecret}
                          onChange={(e) => setWebhookSecret(e.target.value)}
                          placeholder={t('applicationDetail.webhookSecretPlaceholder')}
                          style={{
                            width: '100%', padding: '0.5rem 0.75rem',
                            border: '1.5px solid var(--color-surface-border)', borderRadius: '6px',
                            fontSize: '0.8125rem', fontFamily: 'var(--font-mono)',
                            background: 'var(--color-surface)', color: 'var(--color-text-primary)',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      <strong>{t('applicationDetail.supportedEvents')}</strong>{' '}
                      <code style={{ background: '#F1F5F9', padding: '0 4px', borderRadius: 3 }}>enrollment.created</code>{' '}
                      <code style={{ background: '#F1F5F9', padding: '0 4px', borderRadius: 3 }}>enrollment.disabled</code>{' '}
                      <code style={{ background: '#F1F5F9', padding: '0 4px', borderRadius: 3 }}>auth.locked</code>{' '}
                      <code style={{ background: '#F1F5F9', padding: '0 4px', borderRadius: 3 }}>recovery.used</code>
                    </div>

                    <button
                      id="webhook-save-btn"
                      type="button"
                      onClick={handleSaveWebhook}
                      disabled={webhookLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        background: '#7C3AED', color: '#fff', border: 'none',
                        borderRadius: '6px', padding: '0.5rem 0.875rem',
                        fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer',
                        opacity: webhookLoading ? 0.7 : 1,
                      }}
                    >
                      <Webhook size={14} /> {webhookLoading ? t('common.saving') : t('applicationDetail.saveWebhookBtn')}
                    </button>
                  </div>

                  {/* ─── RATE LİMİT AYARLARI ─── */}
                  <div className="card" style={{ borderTop: '3px solid #F59E0B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Sliders size={18} color="#F59E0B" />
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{t('applicationDetail.rateLimitTitle')}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                          {t('applicationDetail.rateLimitDesc')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4A5568', marginBottom: '0.375rem' }}>
                          {t('applicationDetail.maxRequestsLabel')}
                        </label>
                        <input
                          id="ratelimit-max-input"
                          type="number"
                          min={1}
                          max={10000}
                          value={rlMax}
                          onChange={(e) => setRlMax(e.target.value)}
                          style={{
                            width: '100%', padding: '0.5rem 0.75rem',
                            border: '1.5px solid var(--color-surface-border)', borderRadius: '6px',
                            fontSize: '0.8125rem', background: 'var(--color-surface)',
                            color: 'var(--color-text-primary)', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4A5568', marginBottom: '0.375rem' }}>
                          {t('applicationDetail.windowSecondsLabel')}
                        </label>
                        <input
                          id="ratelimit-window-input"
                          type="number"
                          min={1}
                          max={3600}
                          value={rlWindow}
                          onChange={(e) => setRlWindow(e.target.value)}
                          style={{
                            width: '100%', padding: '0.5rem 0.75rem',
                            border: '1.5px solid var(--color-surface-border)', borderRadius: '6px',
                            fontSize: '0.8125rem', background: 'var(--color-surface)',
                            color: 'var(--color-text-primary)', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.75rem' }}>
                      {t('applicationDetail.currentRateLimit', { max: app.rateLimitMaxRequests ?? 100, window: Math.round((app.rateLimitWindowMs ?? 60000) / 1000) })}
                    </div>

                    <button
                      id="ratelimit-save-btn"
                      type="button"
                      onClick={handleSaveRateLimit}
                      disabled={rlLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        background: '#D97706', color: '#fff', border: 'none',
                        borderRadius: '6px', padding: '0.5rem 0.875rem',
                        fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer',
                        opacity: rlLoading ? 0.7 : 1,
                      }}
                    >
                      <Sliders size={14} /> {rlLoading ? t('common.saving') : t('applicationDetail.saveRateLimitBtn')}
                    </button>
                  </div>

                  <div className="card">
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>{t('applicationDetail.resetApiKeysTitle')}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        {t('applicationDetail.resetApiKeysDesc')}
                      </div>
                    </div>
                    {!showRegenConfirm ? (
                      <button type="button" onClick={() => setShowRegenConfirm(true)} className="btn-danger" style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}>
                        <KeyRound size={14} /> {t('applicationDetail.renewKeysBtn')}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#991B1B' }}>{t('applicationDetail.confirmRegenWarning')}</span>
                        <button type="button" onClick={handleRegenerateKey} style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.7rem', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>{t('common.yesRenew')}</button>
                        <button type="button" onClick={() => setShowRegenConfirm(false)} style={{ background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '4px', padding: '0.3rem 0.7rem', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>{t('common.cancel')}</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTabKey === 'logs' && (
                <div className="card">
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', fontWeight: 800 }}>{t('applicationDetail.appLogsTitle')}</h3>
                  {logsLoading ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</p>
                  ) : logs.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.noLogYet')}</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {logs.map((log) => (
                        <div key={log.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.5rem 0.75rem', borderRadius: '4px', background: '#F8FAFC', border: '1px solid var(--color-surface-border)', fontSize: '0.8125rem'
                        }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-text-primary)', flex: 1 }}>
                            {actionLabels[log.action] || log.action}
                          </span>
                          {log.externalUserId && <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{log.externalUserId}</span>}
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{new Date(log.createdAt).toLocaleString('tr-TR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SAĞ KOLON (340px GENİŞLİK) */}
          <div style={{ width: '340px', minWidth: '340px', flexShrink: 0 }}>
            {/* 1. CANLI QR KOD SANDBOX KARTI */}
            <LiveQRSandboxCard app={app} />

            {/* 2. REHBER VE UYARI KUTULARI */}
            <GuidanceSidebar
              guideTitle={t('applicationDetail.guideTitle')}
              guideText={t('applicationDetail.guideText')}
              warningTitle={t('applicationDetail.warningTitle')}
              warningText={t('applicationDetail.warningText')}
              steps={[
                t('applicationDetail.step1'),
                t('applicationDetail.step2'),
                t('applicationDetail.step3'),
                t('applicationDetail.step4'),
              ]}
            />
          </div>

        </div>
      )}
    </div>
  );
}
