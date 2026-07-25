import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Plus, Search, Filter, LayoutGrid, List, Shield, Users, Key, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppCard from '../components/applications/AppCard';
import AppCreateView from '../components/applications/AppCreateView';
import PageHeaderBar from '../components/ui/PageHeaderBar';
import HelpInfoBanner from '../components/ui/HelpInfoBanner';
import Badge from '../components/ui/Badge';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Applications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'FORCE2FA'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [showCreateView, setShowCreateView] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/applications');
      setApps(data.data.applications || []);
    } catch {
      toast.error(t('toasts.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const filtered = apps.filter((app) => {
    const term = search.toLowerCase();
    const matchesSearch =
      app.name.toLowerCase().includes(term) ||
      app.slug.toLowerCase().includes(term) ||
      (app.domain && app.domain.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (statusFilter === 'ACTIVE') return app.isActive;
    if (statusFilter === 'INACTIVE') return !app.isActive;
    if (statusFilter === 'FORCE2FA') return app.force2FA;

    return true;
  });

  // 2-Sütunlu Yeni Uygulama Kaydı Görünümü Açıksa
  if (showCreateView) {
    return (
      <AppCreateView
        onBack={() => setShowCreateView(false)}
        onSaved={() => {
          setShowCreateView(false);
          fetchApps();
        }}
      />
    );
  }

  const activeAppsCount = apps.filter((a) => a.isActive).length;
  const totalEnrollmentsCount = apps.reduce((sum, a) => sum + (a.activeEnrollments || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
      {/* Üst Başlık Çubuğu */}
      <PageHeaderBar
        icon={Smartphone}
        title={t('applications.title')}
        description={t('applications.description')}
        backTo="/dashboard"
        backLabel={t('common.backToHome')}
      />

      {/* Üst Sarı Yardım Banner'ı */}
      <HelpInfoBanner
        title={t('applications.bannerTitle')}
        items={[
          t('applications.bannerItem1'),
          t('applications.bannerItem2'),
          t('applications.bannerItem3'),
        ]}
      />

      {/* ÜST HIZLI METRİK ÖZET BAR (3 KART) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ padding: '0.875rem 1.125rem', borderLeft: '4px solid #3182CE', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '4px', background: '#EBF8FF', color: '#3182CE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('dashboard.registeredServices')}
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1A202C' }}>
              {t('dashboard.serviceCount', { count: apps.length, active: activeAppsCount })}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0.875rem 1.125rem', borderLeft: '4px solid #10B981', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '4px', background: '#D1FAE5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('dashboard.totalTwoFA')}
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1A202C' }}>
              {t('dashboard.registeredAccounts', { count: totalEnrollmentsCount })}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0.875rem 1.125rem', borderLeft: '4px solid #8B5CF6', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '4px', background: '#EDE9FE', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('dashboard.apiSecurity')}
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1A202C' }}>
              {t('dashboard.hmacEncrypted')}
            </div>
          </div>
        </div>
      </div>

      {/* ARAMA, FİLTRE VE GÖRÜNÜM MODU TOOLBARI */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          {/* Arama Input */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
            <input
              className="input"
              placeholder={t('applications.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>

          {/* Filtre Dropdown */}
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '180px', fontSize: '0.8125rem' }}
          >
            <option value="ALL">{t('applications.allStatuses')}</option>
            <option value="ACTIVE">{t('applications.onlyActive')}</option>
            <option value="INACTIVE">{t('applications.onlyDisabled')}</option>
            <option value="FORCE2FA">{t('applications.force2FA')}</option>
          </select>
        </div>

        {/* Görünüm Seçici Switcher & Yeni Ekle Butonu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#F1F5F9', borderRadius: '4px', padding: '2px', display: 'flex', border: '1px solid #CBD5E1' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.375rem 0.625rem', border: 'none', borderRadius: '2px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 800,
                background: viewMode === 'grid' ? '#3182CE' : 'transparent',
                color: viewMode === 'grid' ? 'white' : '#64748B',
              }}
              title={t('applications.cardView')}
            >
              <LayoutGrid size={14} /> {t('applications.cardView')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.375rem 0.625rem', border: 'none', borderRadius: '2px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 800,
                background: viewMode === 'table' ? '#3182CE' : 'transparent',
                color: viewMode === 'table' ? 'white' : '#64748B',
              }}
              title={t('applications.listView')}
            >
              <List size={14} /> {t('applications.listView')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateView(true)}
            className="btn-primary"
            style={{ padding: '0.625rem 1rem', fontSize: '0.875rem' }}
          >
            <Plus size={18} /> {t('applications.newAppBtn')}
          </button>
        </div>
      </div>

      {/* UYGULAMALAR İÇERİK ALANI (GRID VEYA LISTE TABLOSU) */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#718096' }}>{t('applications.loadingApps')}</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#A0AEC0' }}>
          {t('applications.noMatchingApp')}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID KARTLAR MODU */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {filtered.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onClick={() => navigate(`/apps/${app.id}`)}
            />
          ))}
        </div>
      ) : (
        /* DETAYLI LISTE TABLOSU MODU */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '28%' }}>{t('applications.appNameHeader')}</th>
                <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '22%' }}>DOMAIN</th>
                <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '14%' }}>{t('applications.userHeader')}</th>
                <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '16%' }}>{t('applications.policy')}</th>
                <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '10%' }}>{t('applications.statusHeader')}</th>
                <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', textAlign: 'right', width: '10%' }}>{t('applications.actionHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => navigate(`/apps/${app.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'normal' }}>
                    <div style={{ fontWeight: 800, color: '#1A202C', fontSize: '0.875rem' }}>{app.name}</div>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#718096' }}>
                      slug: {app.slug}
                    </span>
                  </td>

                  <td style={{ padding: '0.75rem 1rem' }}>
                    {app.domain ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#2B6CB0', fontWeight: 700 }}>
                        🌐 {app.domain}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#A0AEC0', fontStyle: 'italic' }}>{t('applications.domainNotDefined')}</span>
                    )}
                  </td>

                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontWeight: 800, color: '#1A202C', fontSize: '0.875rem' }}>
                      {app.activeEnrollments || 0} {t('auth.user')}
                    </span>
                  </td>

                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge type={app.force2FA ? 'purple' : 'info'}>
                      {app.force2FA ? t('applications.mandatory') : t('applications.flexible')}
                    </Badge>
                  </td>

                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge type={app.isActive ? 'active' : 'inactive'} showDot>
                      {app.isActive ? t('common.active') : t('applications.onlyDisabled')}
                    </Badge>
                  </td>

                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#2563EB', fontWeight: 800 }}
                    >
                      {t('applications.manageBtn')} <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
