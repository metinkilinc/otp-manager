import { useState, useEffect } from 'react';
import { ClipboardList, Filter, Search, RefreshCw, Smartphone, Shield, FileText, CheckCircle2, AlertTriangle, Calendar, User, Globe, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeaderBar from '../components/ui/PageHeaderBar';
import HelpInfoBanner from '../components/ui/HelpInfoBanner';
import GuidanceSidebar from '../components/ui/GuidanceSidebar';
import Badge from '../components/ui/Badge';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function AuditLog() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3500';
      const url = `/api/analytics/export?format=csv${selectedApp ? `&appId=${selectedApp}` : ''}`;
      window.location.href = baseUrl + url;
      toast.success(t('toasts.csvPrepared'));
    } catch {
      toast.error(t('toasts.errorOccurred'));
    } finally {
      setTimeout(() => setExporting(false), 1500);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logRes, appRes] = await Promise.all([
        api.get(`/audit-logs?limit=100${selectedApp ? `&appId=${selectedApp}` : ''}`),
        api.get('/admin/applications'),
      ]);
      setLogs(logRes.data.data.logs || []);
      setApps(appRes.data.data.applications || []);
      if (logRes.data.data.logs?.length > 0 && !selectedLog) {
        setSelectedLog(logRes.data.data.logs[0]);
      }
    } catch {
      toast.error(t('auditLog.fetchFailed') || t('toasts.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedApp]);

  const actionLabels = {
    ENROLL_START: { label: t('auditLog.actions.ENROLL_START'), type: 'info' },
    ENROLL_VERIFY: { label: t('auditLog.actions.ENROLL_VERIFY'), type: 'active' },
    TOTP_VERIFY_SUCCESS: { label: t('auditLog.actions.TOTP_VERIFY_SUCCESS'), type: 'active' },
    TOTP_VERIFY_FAIL: { label: t('auditLog.actions.TOTP_VERIFY_FAIL'), type: 'danger' },
    TOTP_ENABLE: { label: t('auditLog.actions.TOTP_ENABLE'), type: 'active' },
    TOTP_DISABLE: { label: t('auditLog.actions.TOTP_DISABLE'), type: 'warning' },
    TOTP_RESET: { label: t('auditLog.actions.TOTP_RESET'), type: 'purple' },
    RECOVERY_USED: { label: t('auditLog.actions.RECOVERY_USED'), type: 'warning' },
    ACCOUNT_LOCKED: { label: t('auditLog.actions.ACCOUNT_LOCKED'), type: 'danger' },
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.externalUserId && log.externalUserId.toLowerCase().includes(term)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
      {/* Üst Başlık Çubuğu */}
      <PageHeaderBar
        icon={ClipboardList}
        title={t('auditLog.pageTitle')}
        description={t('auditLog.pageDesc')}
        backTo="/dashboard"
        backLabel={t('common.backToHome')}
      />

      {/* Üst Sarı Yardım Banner'ı */}
      <HelpInfoBanner
        title={t('auditLog.bannerTitle')}
        items={[
          t('auditLog.bannerItem1'),
          t('auditLog.bannerItem2'),
        ]}
      />

      {/* YAN YANA (SIDE-BY-SIDE) 2-SÜTUNLU DÜZEN */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
        
        {/* SOL KOLON (%68 GENİŞLİK — FİLTRELER VE HİZALANMIŞ LOG TABLOSU) */}
        <div style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Filtre Barı Kartı */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
                <input
                  className="input"
                  placeholder={t('auditLog.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '2.5rem', fontSize: '0.8125rem' }}
                />
              </div>

              <select
                className="input"
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                style={{ width: '220px', fontSize: '0.8125rem' }}
              >
                <option value="">{t('auditLog.allApps')}</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={fetchData}
              className="btn-ghost"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
            >
              <RefreshCw size={14} /> {t('common.refresh')}
            </button>

            <button
              id="audit-export-csv-btn"
              type="button"
              onClick={handleExport}
              disabled={exporting}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                background: '#3182CE', color: 'white', border: 'none',
                borderRadius: '6px', padding: '0.5rem 0.875rem',
                fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                opacity: exporting ? 0.7 : 1,
              }}
            >
              <Download size={14} /> {exporting ? t('common.preparing') : t('auditLog.exportCsv')}
            </button>
          </div>

          {/* HİZALANMIŞ KUSURSUZ TABLO KARTI */}
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>{t('common.loading')}</div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>{t('auditLog.noLogRecord')}</div>
            ) : (
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '25%' }}>{t('auditLog.actionHeader')}</th>
                    <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '22%' }}>{t('sidebar.applications')}</th>
                    <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '20%' }}>{t('enrollments.userIdHeader')}</th>
                    <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '15%' }}>{t('auditLog.ipHeader')}</th>
                    <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', textAlign: 'right', width: '18%' }}>{t('auditLog.dateTimeHeader')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const actionInfo = actionLabels[log.action] || { label: log.action, type: 'info' };
                    const isSelected = selectedLog?.id === log.id;

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#EBF8FF' : undefined,
                          borderBottom: '1px solid #EDF2F7',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Badge type={actionInfo.type}>
                            {actionInfo.label}
                          </Badge>
                        </td>

                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: '#2B6CB0', fontSize: '0.8125rem' }}>
                            {log.application?.name || t('common.system')}
                          </span>
                        </td>

                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#4A5568' }}>
                            {log.externalUserId || '—'}
                          </span>
                        </td>

                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#718096' }}>
                            {log.ipAddress || '127.0.0.1'}
                          </span>
                        </td>

                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: '#718096', whiteSpace: 'nowrap' }}>
                            {new Date(log.createdAt).toLocaleString('tr-TR')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>

        {/* SAĞ KOLON: SAĞ TARAFTA YAN YANA SEÇİLİ LOG JSON İNCELEYİCİ VE BİLGİLENDİRME NOTLARI (340px Sabit Genişlik) */}
        <div style={{ width: '340px', minWidth: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Seçili Log JSON İnceleyici Kartı */}
          {selectedLog && (
            <div className="card" style={{ borderTop: '4px solid #3182CE' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#1A202C', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <FileText size={15} color="#3182CE" /> {t('auditLog.payloadTitle')}
                </h4>
                <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#718096' }}>
                  ID: {selectedLog.id.slice(0, 8)}...
                </span>
              </div>
              <pre style={{
                margin: 0, padding: '0.75rem', background: '#1E293B', color: '#60A5FA',
                borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                maxHeight: '220px', overflowY: 'auto', lineHeight: 1.5,
              }}>
                {JSON.stringify(selectedLog.details || { action: selectedLog.action, ip: selectedLog.ipAddress }, null, 2)}
              </pre>
            </div>
          )}

          {/* Guidance Sidebar */}
          <GuidanceSidebar
            guideTitle={t('auditLog.sidebarGuideTitle')}
            guideText={t('auditLog.sidebarGuideText')}
            warningTitle={t('auditLog.sidebarWarningTitle')}
            warningText={t('auditLog.sidebarWarningText')}
            steps={[
              t('auditLog.step1'),
              t('auditLog.step2'),
              t('auditLog.step3'),
              t('auditLog.step4'),
            ]}
          />
        </div>

      </div>
    </div>
  );
}
