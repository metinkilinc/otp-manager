import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Smartphone, Users, ShieldCheck, ShieldAlert, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PageHeaderBar from '../components/ui/PageHeaderBar';
import HelpInfoBanner from '../components/ui/HelpInfoBanner';
import GuidanceSidebar from '../components/ui/GuidanceSidebar';
import TotpSimulatorWidget from '../components/dashboard/TotpSimulatorWidget';
import ApiPlaygroundWidget from '../components/dashboard/ApiPlaygroundWidget';
import api from '../api/client';
import toast from 'react-hot-toast';

function buildWeeklyData(logs, lang = 'tr') {
  const today = new Date();
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayLabel = d.toLocaleDateString(lang, { weekday: 'short' });
    const dayStr = d.toISOString().slice(0, 10);

    const dayLogs = logs.filter((l) => l.createdAt?.slice(0, 10) === dayStr);
    const istek = dayLogs.length;
    const basarili = dayLogs.filter((l) =>
      l.action === 'TOTP_VERIFY_SUCCESS' || l.action === 'ENROLL_VERIFY'
    ).length;

    result.push({ name: dayLabel, istek, basarili });
  }
  return result;
}

// Uygulama listesinden pie verisi üret — gerçek kayıt sayılarından
const PIE_COLORS = ['#3182CE', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

function buildPieData(apps, otherLabel = 'Other Services') {
  const active = apps.filter((a) => a.isActive && (a.activeEnrollments || 0) > 0);
  const sorted = [...active].sort((a, b) => (b.activeEnrollments || 0) - (a.activeEnrollments || 0));
  const top = sorted.slice(0, 6);
  const rest = sorted.slice(6);
  const restTotal = rest.reduce((s, a) => s + (a.activeEnrollments || 0), 0);

  const data = top.map((a, i) => ({
    name: a.name,
    value: a.activeEnrollments || 0,
    color: PIE_COLORS[i],
  }));

  if (restTotal > 0) {
    data.push({ name: otherLabel, value: restTotal, color: PIE_COLORS[6] });
  }
  return data;
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({
    totalApps: 0,
    activeApps: 0,
    totalEnrollments: 0,
    activeEnrollments: 0,
    successCount: 0,
    failCount: 0,
    lockedUsers: 0,
    successRate: null,
  });
  const [apps, setApps] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [appRes, userRes, logRes] = await Promise.all([
        api.get('/admin/applications'),
        api.get('/admin/users'),
        api.get('/audit-logs?limit=200'),
      ]);

      const apps = appRes.data.data.applications || [];
      const users = userRes.data.data.users || [];
      const logs = logRes.data.data.logs || [];

      const activeAppsCount = apps.filter((a) => a.isActive).length;
      const lockedCount = users.filter(
        (u) => u.lockedUntil && new Date(u.lockedUntil) > new Date()
      ).length;

      const successCount = logs.filter((l) => l.action === 'TOTP_VERIFY_SUCCESS').length;
      const failCount = logs.filter((l) => l.action === 'TOTP_VERIFY_FAIL').length;
      const totalValidations = successCount + failCount;
      const successRate =
        totalValidations > 0 ? ((successCount / totalValidations) * 100).toFixed(1) : null;

      const totalEnrollments = apps.reduce((sum, a) => sum + (a.totalEnrollments || 0), 0);
      const activeEnrollments = apps.reduce((sum, a) => sum + (a.activeEnrollments || 0), 0);

      setStats({
        totalApps: apps.length,
        activeApps: activeAppsCount,
        totalEnrollments,
        activeEnrollments,
        successCount,
        failCount,
        lockedUsers: lockedCount,
        successRate,
      });

      setApps(apps);
      setRecentLogs(logs.slice(0, 10));

      setWeeklyData(buildWeeklyData(logs, i18n.language || 'tr'));
      setPieData(buildPieData(apps, t('dashboard.otherServices')));
    } catch {
      toast.error(t('toasts.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
      {/* Üst Başlık Çubuğu */}
      <PageHeaderBar
        icon={LayoutDashboard}
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        backTo="/apps"
        backLabel={t('sidebar.applications')}
        actions={
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.4rem 0.875rem', background: loading ? '#E2E8F0' : '#3182CE',
              color: loading ? '#718096' : '#fff', border: 'none', borderRadius: '4px',
              fontWeight: 700, fontSize: '0.8125rem', cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {t('common.refresh')}
          </button>
        }
      />

      {/* Üst Sarı Yardım Banner'ı */}
      <HelpInfoBanner
        title={t('dashboard.bannerTitle')}
        items={[
          t('dashboard.bannerItem1'),
          t('dashboard.bannerItem2'),
        ]}
      />

      {/* YAN YANA (SIDE-BY-SIDE) 2-SÜTUNLU DÜZEN */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'nowrap' }}>

        {/* SOL KOLON */}
        <div style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 4'LÜ METRİK KART GRID'İ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>

            {/* Kart 1: Toplam Uygulama */}
            <div className="card" style={{ padding: '1rem', borderTop: '4px solid #3182CE', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('dashboard.registeredServices')}
                </span>
                <div style={{ width: 28, height: 28, borderRadius: '4px', background: '#EBF8FF', color: '#3182CE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1A202C' }}>
                {stats.totalApps} <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>({stats.activeApps} {t('common.active')})</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#718096' }}>
                {t('dashboard.disabledServices', { count: stats.totalApps - stats.activeApps })}
              </div>
            </div>

            {/* Kart 2: 2FA Kayıtları */}
            <div className="card" style={{ padding: '1rem', borderTop: '4px solid #10B981', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('dashboard.statActiveEnrollments')}
                </span>
                <div style={{ width: 28, height: 28, borderRadius: '4px', background: '#D1FAE5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1A202C' }}>
                {stats.activeEnrollments} <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>{t('common.active')}</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#718096' }}>
                {t('dashboard.totalEnrollments', { count: stats.totalEnrollments })}
              </div>
            </div>

            {/* Kart 3: Doğrulama İstatistikleri */}
            <div className="card" style={{ padding: '1rem', borderTop: '4px solid #8B5CF6', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('dashboard.validations')}
                </span>
                <div style={{ width: 28, height: 28, borderRadius: '4px', background: '#EDE9FE', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1A202C' }}>
                {stats.successCount} <span style={{ fontSize: '0.75rem', color: '#8B5CF6', fontWeight: 700 }}>{t('dashboard.success')}</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {stats.successRate !== null ? (
                  <>
                    <Activity size={12} color="#8B5CF6" />
                    <span>{t('dashboard.successRate', { rate: stats.successRate })}</span>
                  </>
                ) : (
                  <span>{t('dashboard.noDataYet')}</span>
                )}
              </div>
            </div>

            {/* Kart 4: Kilitli & Başarısız */}
            <div className="card" style={{ padding: '1rem', borderTop: '4px solid #F59E0B', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('dashboard.security')}
                </span>
                <div style={{ width: 28, height: 28, borderRadius: '4px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1A202C' }}>
                {stats.lockedUsers} <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>{t('common.warning')}</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#718096' }}>
                {t('dashboard.failedAttempts', { count: stats.failCount })}
              </div>
            </div>

          </div>

          {/* GRAFİKLER GRID'İ (2 KOLON) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>

            {/* Haftalık 2FA Doğrulama Trendi */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#1A202C' }}>
                  {t('dashboard.weeklyVolume')}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#718096' }}>{t('dashboard.weeklySub')}</span>
              </div>
              {weeklyData.every((d) => d.istek === 0) ? (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0AEC0', fontSize: '0.875rem' }}>
                  {t('dashboard.noWeeklyData')}
                </div>
              ) : (
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="colorIstek" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3182CE" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3182CE" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorBasarili" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                      <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
                      <YAxis stroke="#A0AEC0" fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="istek" name={t('dashboard.totalRequests')} stroke="#3182CE" strokeWidth={2} fillOpacity={1} fill="url(#colorIstek)" />
                      <Area type="monotone" dataKey="basarili" name={t('dashboard.success')} stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorBasarili)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Servis Bazlı Dağılım */}
            <div className="card">
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9375rem', fontWeight: 800, color: '#1A202C' }}>
                {t('dashboard.serviceDistribution')}
              </h3>
              {pieData.length === 0 ? (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0AEC0', fontSize: '0.875rem' }}>
                  {t('dashboard.noActiveRecord')}
                </div>
              ) : (
                <>
                  <div style={{ width: '100%', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [t('dashboard.userCount', { v }), n]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', fontSize: '0.6875rem', marginTop: '0.5rem' }}>
                    {pieData.map((d) => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '2px', background: d.color, flexShrink: 0 }} />
                        <span style={{ color: '#4A5568', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.name} ({d.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* SON İŞLEM LOGLARI */}
          <div className="card">
            <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.9375rem', fontWeight: 800, color: '#1A202C' }}>
              {t('dashboard.recentTransactions')}
            </h3>
            {recentLogs.length === 0 ? (
              <p style={{ color: '#A0AEC0', fontSize: '0.875rem', margin: 0 }}>{t('dashboard.noLogYet')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {recentLogs.map((log) => (
                  <div key={log.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.5rem 0.75rem', borderRadius: '4px',
                    background: '#F8FAFC', border: '1px solid var(--color-surface-border)',
                    fontSize: '0.8125rem',
                  }}>
                    <span style={{
                      fontWeight: 800, flex: 1,
                      color: log.action === 'TOTP_VERIFY_FAIL' || log.action === 'ACCOUNT_LOCKED'
                        ? '#C53030' : log.action === 'TOTP_VERIFY_SUCCESS' ? '#276749' : '#2D3748',
                    }}>
                      {actionLabels[log.action] || log.action}
                    </span>
                    {log.externalUserId && (
                      <span style={{ color: '#718096', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {log.externalUserId}
                      </span>
                    )}
                    <span style={{ color: '#A0AEC0', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('tr-TR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* İNTERAKTİF WIDGET'LAR */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <TotpSimulatorWidget />
            <ApiPlaygroundWidget
              apiKey={apps.find((a) => a.isActive)?.apiKey || undefined}
            />
          </div>


        </div>

        {/* SAĞ KOLON */}
        <div style={{ width: '340px', minWidth: '340px', flexShrink: 0 }}>
          <GuidanceSidebar
            guideTitle={t('dashboard.sidebarGuideTitle')}
            guideText={t('dashboard.sidebarGuideText')}
            warningTitle={t('common.info')}
            warningText={t('dashboard.sidebarWarningText')}
            steps={[
              t('dashboard.step1'),
              t('dashboard.step2'),
              t('dashboard.step3'),
              t('dashboard.step4'),
            ]}
          />
        </div>

      </div>
    </div>
  );
}
