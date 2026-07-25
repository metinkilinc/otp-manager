import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart2, ShieldAlert, TrendingUp, Activity,
  Users, CheckCircle2, XCircle, Lock, RefreshCw, Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeaderBar from '../components/ui/PageHeaderBar';
import HelpInfoBanner from '../components/ui/HelpInfoBanner';
import api from '../api/client';
import toast from 'react-hot-toast';

// Özel tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #E2E8F0',
      borderRadius: '4px', padding: '0.625rem 0.875rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '0.8125rem',
    }}>
      <div style={{ fontWeight: 800, marginBottom: '0.375rem', color: '#1A202C' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
}

// Stat kartı
function StatCard({ icon: Icon, label, value, sub, color, bgColor }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #E2E8F0',
      borderRadius: '4px', padding: '1.25rem',
      borderTop: `3px solid ${color}`,
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        <div style={{ background: bgColor, borderRadius: '4px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1A202C', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#718096' }}>{sub}</div>}
    </div>
  );
}

export default function Analytics() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState(null);
  const [traffic, setTraffic] = useState([]);
  const [topApps, setTopApps] = useState([]);
  const [threats, setThreats] = useState({ lockedAccounts: [], suspiciousIps: [] });
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const periodOptions = [
    { value: '7d', label: t('analytics.last7Days') },
    { value: '14d', label: t('analytics.last14Days') },
    { value: '30d', label: t('analytics.last30Days') },
  ];

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ovRes, trRes, topRes, thrRes, appRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get(`/analytics/traffic?period=${period}${selectedApp ? `&appId=${selectedApp}` : ''}`),
        api.get('/analytics/top-apps'),
        api.get('/analytics/threats'),
        api.get('/admin/applications'),
      ]);
      setOverview(ovRes.data.data);
      setTraffic(trRes.data.data.traffic || []);
      setTopApps(topRes.data.data.topApps || []);
      setThreats(thrRes.data.data);
      setApps(appRes.data.data.applications || []);
    } catch {
      toast.error(t('analytics.dataFetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [period, selectedApp]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = `/api/analytics/export?format=csv${selectedApp ? `&appId=${selectedApp}` : ''}`;
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3500';
      window.location.href = baseUrl + url;
      toast.success(t('analytics.exportingCsv'));
    } catch {
      toast.error(t('analytics.exportFailed'));
    } finally {
      setTimeout(() => setExporting(false), 1500);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '4px', border: '3px solid var(--color-primary-light)', borderTop: '3px solid var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      <PageHeaderBar
        icon={BarChart2}
        title={t('analytics.pageTitle')}
        description={t('analytics.pageDesc')}
      />

      <HelpInfoBanner
        title={t('analytics.bannerTitle')}
        items={[
          t('analytics.bannerItem1'),
          t('analytics.bannerItem2'),
          t('analytics.bannerItem3'),
        ]}
      />

      {/* Filtre Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <select
          id="analytics-app-filter"
          value={selectedApp}
          onChange={(e) => setSelectedApp(e.target.value)}
          style={{
            border: '1.5px solid var(--color-surface-border)', borderRadius: '4px',
            padding: '0.5rem 0.75rem', fontSize: '0.8125rem', background: 'white',
            color: 'var(--color-text-primary)', cursor: 'pointer',
          }}
        >
          <option value="">{t('analytics.allApps')}</option>
          {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <div style={{ display: 'flex', gap: '0.25rem', background: '#F7FAFC', borderRadius: '4px', padding: '0.25rem', border: '1px solid #E2E8F0' }}>
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              id={`period-${opt.value}`}
              type="button"
              onClick={() => setPeriod(opt.value)}
              style={{
                padding: '0.375rem 0.75rem', borderRadius: '4px', border: 'none',
                fontSize: '0.8125rem', fontWeight: period === opt.value ? 800 : 600,
                background: period === opt.value ? 'white' : 'transparent',
                color: period === opt.value ? '#3182CE' : '#718096',
                cursor: 'pointer',
                boxShadow: period === opt.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          id="analytics-refresh-btn"
          type="button"
          onClick={fetchAll}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            background: '#F7FAFC', border: '1px solid #E2E8F0',
            borderRadius: '4px', padding: '0.5rem 0.75rem',
            fontSize: '0.8125rem', fontWeight: 700, color: '#4A5568', cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} /> {t('common.refresh')}
        </button>

        <button
          id="analytics-export-btn"
          type="button"
          onClick={handleExport}
          disabled={exporting}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            background: '#3182CE', color: 'white', border: 'none',
            borderRadius: '4px', padding: '0.5rem 0.875rem',
            fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
            opacity: exporting ? 0.7 : 1, marginLeft: 'auto',
          }}
        >
          <Download size={14} /> {exporting ? t('common.preparing') : t('common.exportCsv')}
        </button>
      </div>

      {/* Özet Stat Kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatCard icon={Activity}      label={t('analytics.statTotalApps')}        value={overview?.totalApps}        color="#3182CE" bgColor="#EBF8FF" />
        <StatCard icon={Users}         label={t('analytics.statActiveEnrollments')} value={overview?.activeEnrollments} color="#10B981" bgColor="#F0FDF4" />
        <StatCard icon={CheckCircle2}  label={t('analytics.statTodaySuccess')}     value={overview?.todaySuccess}      color="#10B981" bgColor="#F0FDF4"
          sub={overview?.successRate != null ? t('analytics.successRateSub', { rate: overview.successRate }) : undefined} />
        <StatCard icon={XCircle}       label={t('analytics.statTodayFail')}        value={overview?.todayFail}          color="#E53E3E" bgColor="#FEF2F2" />
        <StatCard icon={Lock}          label={t('analytics.statLockedAccounts')}   value={overview?.lockedCount}        color="#F59E0B" bgColor="#FFFBEB" />
      </div>

      {/* Trafik Area Chart */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '1.5rem', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <TrendingUp size={18} color="#3182CE" />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{t('analytics.trafficChartTitle')}</h3>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={traffic} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorBasarili" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBasarisiz" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#E53E3E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#718096' }} />
            <YAxis tick={{ fontSize: 12, fill: '#718096' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '0.8125rem', fontWeight: 600 }}
              formatter={(v) => v === 'basarili' ? t('analytics.successful') : t('analytics.failed')}
            />
            <Area type="monotone" dataKey="basarili" name={t('analytics.successful')} stroke="#10B981" strokeWidth={2.5} fill="url(#colorBasarili)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="basarisiz" name={t('analytics.failed')} stroke="#E53E3E" strokeWidth={2.5} fill="url(#colorBasarisiz)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Top Apps Bar Chart */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '1.5rem', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <BarChart2 size={18} color="#8B5CF6" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{t('analytics.topAppsTitle')}</h3>
            <span style={{ fontSize: '0.75rem', color: '#718096', marginLeft: 'auto' }}>{t('analytics.last30Days')}</span>
          </div>
          {topApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#A0AEC0' }}>{t('common.noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topApps} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#718096' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#4A5568', fontWeight: 600 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name={t('dashboard.statTodaySuccess')} fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tehdit Tablosu */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '1.5rem', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <ShieldAlert size={18} color="#E53E3E" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{t('analytics.threatsTitle')}</h3>
            <span style={{ fontSize: '0.75rem', color: '#718096', marginLeft: 'auto' }}>{t('analytics.last24Hours')}</span>
          </div>

          {/* Şüpheli IP'ler */}
          {threats.suspiciousIps.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#E53E3E', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {t('analytics.suspiciousIpsHeader', { count: threats.suspiciousIps.length })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {threats.suspiciousIps.map((ip) => (
                  <div key={ip.ipAddress} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.375rem 0.625rem', background: '#FEF2F2',
                    borderRadius: '4px', border: '1px solid #FCA5A5',
                  }}>
                    <code style={{ fontSize: '0.8125rem', color: '#991B1B', fontWeight: 700 }}>{ip.ipAddress}</code>
                    <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>{t('analytics.failedCount', { count: ip.failCount })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kilitli Hesaplar */}
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {t('analytics.lockedAccountsHeader', { count: threats.lockedAccounts.length })}
          </div>
          {threats.lockedAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#A0AEC0', fontSize: '0.8125rem' }}>
              {t('analytics.noLocked24h')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '180px', overflowY: 'auto' }}>
              {threats.lockedAccounts.map((acc) => (
                <div key={acc.id} style={{
                  padding: '0.375rem 0.625rem', background: '#FFFBEB',
                  borderRadius: '4px', border: '1px solid #FDE68A',
                  fontSize: '0.8125rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#92400E' }}>{acc.externalUserId}</span>
                    <span style={{ color: '#B45309', fontSize: '0.75rem' }}>{acc.applicationName}</span>
                  </div>
                  {acc.ipAddress && <div style={{ color: '#A0AEC0', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', marginTop: '0.125rem' }}>{acc.ipAddress}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
