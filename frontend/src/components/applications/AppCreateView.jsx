import { useState } from 'react';
import { Smartphone, User, Globe, AlignLeft, ShieldCheck, Layers, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeaderBar from '../ui/PageHeaderBar';
import HelpInfoBanner from '../ui/HelpInfoBanner';
import GuidanceSidebar from '../ui/GuidanceSidebar';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';

const AppCreateView = ({ onBack, onSaved }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState({
    name: '', slug: '', domain: '', description: '', force2FA: false,
  });
  const [loading, setLoading] = useState(false);

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase()
      .replace(/[çÇ]/g, 'c').replace(/[ğĞ]/g, 'g')
      .replace(/[ıİ]/g, 'i').replace(/[öÖ]/g, 'o')
      .replace(/[şŞ]/g, 's').replace(/[üÜ]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm((f) => ({ ...f, name, slug }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug) {
      toast.error(t('appCreate.fillRequiredFields'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/applications', form);
      addNotification(
        t('appCreate.createdNotificationTitle'),
        t('appCreate.createdNotificationMessage', { name: form.name }),
        'success'
      );
      toast.success(t('appCreate.saveSuccessToast'));
      if (onSaved) onSaved();
      if (onBack) onBack();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t('appCreate.saveFailedToast'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Üst Başlık Çubuğu */}
      <PageHeaderBar
        icon={Smartphone}
        title={t('appCreate.pageTitle')}
        description={t('appCreate.pageDesc')}
        backTo="/apps"
        backLabel={t('common.back')}
      />

      {/* Üst Sarı Yardım Banner'ı */}
      <HelpInfoBanner
        title={t('appCreate.bannerTitle')}
        items={[
          t('appCreate.bannerItem1'),
          t('appCreate.bannerItem2'),
          t('appCreate.bannerItem3'),
        ]}
      />

      {/* YAN YANA (SIDE-BY-SIDE) ESNEK DÜZEN */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
        
        {/* SOL KOLON: FORM (%68 Genişlik) */}
        <div style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Bölüm 1: Talep Eden Personel */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-surface-border)' }}>
              <User size={16} color="#3182CE" />
              <span>{t('appCreate.requesterTitle')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>{t('appCreate.requesterPersonnel')}</span>
                <div style={{ fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.125rem' }}>
                  {user?.name || 'Admin'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>{t('appCreate.registrationDate')}</span>
                <div style={{ fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.125rem' }}>
                  {new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* Bölüm 2: Uygulama Tanımları Formu */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.875rem', color: 'var(--color-text-primary)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-surface-border)' }}>
              <Layers size={16} color="#3182CE" />
              <span>{t('appCreate.appInfoTitle')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
                  {t('appCreate.appNameLabel')}
                </label>
                <input
                  id="app-create-name"
                  type="text"
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder={t('appCreate.appNamePlaceholder')}
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem',
                    border: '1.5px solid var(--color-surface-border)', borderRadius: '6px',
                    fontSize: '0.8125rem', outline: 'none', background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
                  {t('appCreate.slugLabel')} <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('appCreate.slugHint')}</span>
                </label>
                <input
                  id="app-create-slug"
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="insan-kaynaklari-portali"
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem',
                    border: '1.5px solid var(--color-surface-border)', borderRadius: '6px',
                    fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', outline: 'none',
                    background: '#F8FAFC', color: '#2B6CB0', fontWeight: 700, boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
                {t('appCreate.domainLabel')}
              </label>
              <div style={{ position: 'relative' }}>
                <Globe size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
                <input
                  id="app-create-domain"
                  type="text"
                  value={form.domain}
                  onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                  placeholder={t('appCreate.domainPlaceholder')}
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                    border: '1.5px solid var(--color-surface-border)', borderRadius: '6px',
                    fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', outline: 'none',
                    background: 'var(--color-surface)', color: 'var(--color-text-primary)', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
                {t('appCreate.descLabel')}
              </label>
              <textarea
                id="app-create-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t('appCreate.descPlaceholder')}
                style={{
                  width: '100%', padding: '0.625rem 0.875rem',
                  border: '1.5px solid var(--color-surface-border)', borderRadius: '6px',
                  fontSize: '0.8125rem', outline: 'none', background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Bölüm 3: Güvenlik Politikası & Kaydet */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '0.875rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-surface-border)' }}>
              <ShieldCheck size={16} color="#3182CE" />
              <span>{t('appCreate.securityPoliciesTitle')}</span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
              <input
                id="app-create-force2fa"
                type="checkbox"
                checked={form.force2FA}
                onChange={(e) => setForm((f) => ({ ...f, force2FA: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: '#3182CE', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {t('appCreate.force2FAOption')}
              </span>
            </label>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onBack}
                className="btn-ghost"
                style={{ padding: '0.625rem 1.25rem' }}
              >
                {t('common.cancel')}
              </button>
              <button
                id="app-create-submit-btn"
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary"
                style={{ padding: '0.625rem 1.5rem', fontWeight: 800 }}
              >
                {loading ? t('appCreate.savingApp') : t('appCreate.saveAppBtn')}
              </button>
            </div>
          </div>

        </div>

        {/* SAĞ KOLON: REHBER NOTLARI (340px Sabit Genişlik) */}
        <div style={{ width: '340px', minWidth: '340px', flexShrink: 0 }}>
          <GuidanceSidebar
            guideTitle={t('appCreate.sidebarGuideTitle')}
            guideText={t('appCreate.sidebarGuideText')}
            warningTitle={t('appCreate.sidebarWarningTitle')}
            warningText={t('appCreate.sidebarWarningText')}
            steps={[
              t('appCreate.step1'),
              t('appCreate.step2'),
              t('appCreate.step3'),
              t('appCreate.step4'),
            ]}
          />
        </div>

      </div>
    </div>
  );
};

export default AppCreateView;
