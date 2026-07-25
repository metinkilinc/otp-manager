import { useState } from 'react';
import { Smartphone, Users, Key, ArrowRight, Globe, Lock, Copy, Check, ShieldCheck, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';

const AppCard = ({ app, onClick }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const activeCount = app.activeEnrollments || 0;
  const totalCount = app.totalEnrollments || 0;
  const percentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : (activeCount > 0 ? 100 : 0);

  const handleCopyKey = (e) => {
    e.stopPropagation();
    if (app.apiKey) {
      navigator.clipboard.writeText(app.apiKey);
      setCopied(true);
      toast.success(t('applications.apiKeyCopied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={onClick}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.25rem',
        border: '1px solid #CBD5E1',
        borderTop: app.isActive ? '4px solid #3182CE' : '4px solid #E53E3E',
        borderRadius: '4px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(49,130,206,0.15)';
        e.currentTarget.style.borderColor = '#3182CE';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.04)';
        e.currentTarget.style.borderColor = '#CBD5E1';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Kart Üst Başlık & Rozetler */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '4px',
            background: app.isActive ? 'linear-gradient(135deg, #EBF8FF 0%, #BEE3F8 100%)' : '#FFF5F5',
            color: app.isActive ? '#2B6CB0' : '#E53E3E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid',
            borderColor: app.isActive ? '#90CDF4' : '#FEB2B2',
            boxShadow: app.isActive ? '0 2px 8px rgba(49,130,206,0.2)' : 'none',
          }}>
            <Smartphone size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#1A202C', lineHeight: 1.2 }}>
              {app.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
              <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#718096', background: '#EDF2F7', padding: '0.0625rem 0.375rem', borderRadius: '2px' }}>
                slug: {app.slug}
              </span>
            </div>
          </div>
        </div>

        <Badge type={app.isActive ? 'active' : 'inactive'} showDot>
          {app.isActive ? t('common.active') : t('applications.onlyDisabled')}
        </Badge>
      </div>

      {/* Domain veya Açıklama */}
      <div style={{ fontSize: '0.8125rem', color: '#4A5568', lineHeight: 1.4 }}>
        {app.domain ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#2B6CB0', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            <Globe size={13} /> {app.domain}
          </div>
        ) : (
          <span style={{ color: '#A0AEC0', fontStyle: 'italic', fontSize: '0.75rem' }}>{t('applications.domainNotDefined')}</span>
        )}
        {app.description && (
          <p style={{ margin: '0.375rem 0 0', color: '#718096', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {app.description}
          </p>
        )}
      </div>

      {/* 4'lü Zengin Metrik Grid'i */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem',
        padding: '0.625rem', background: '#F1F5F9', borderRadius: '4px',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <Users size={11} /> {t('applications.userHeader')}
          </span>
          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A', marginTop: '0.125rem' }}>
            {activeCount}
          </div>
        </div>

        <div style={{ textAlign: 'center', borderLeft: '1px solid #CBD5E1', borderRight: '1px solid #CBD5E1' }}>
          <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <Key size={11} /> API KEY
          </span>
          <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#10B981', marginTop: '0.25rem' }}>
            HMAC-256
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <Lock size={11} /> {t('applications.policy')}
          </span>
          <div style={{ fontWeight: 800, fontSize: '0.75rem', color: app.force2FA ? '#8B5CF6' : '#64748B', marginTop: '0.25rem' }}>
            {app.force2FA ? t('applications.mandatory2FA') : t('applications.flexible2FA')}
          </div>
        </div>
      </div>

      {/* Adaptasyon İlerleme Çubuğu */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', marginBottom: '0.25rem' }}>
          <span>{t('applications.adaptationRate')}</span>
          <span style={{ color: '#2563EB' }}>%{percentage}</span>
        </div>
        <div style={{ height: '6px', width: '100%', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.max(percentage, 5)}%`, background: app.isActive ? 'linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)' : '#CBD5E1', borderRadius: '2px', transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Kart Alt Aksiyon Barı */}
      <div style={{
        paddingTop: '0.625rem', borderTop: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.8125rem', fontWeight: 800, color: '#2563EB',
      }}>
        <button
          type="button"
          onClick={handleCopyKey}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.75rem', color: copied ? '#10B981' : '#64748B',
            display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700,
          }}
          title={t('applications.copyApiKey')}
        >
          {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
          <span>{copied ? t('common.copied') : 'API Key'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#2563EB' }}>
          <span>{t('applications.detailManage')}</span>
          <ArrowRight size={15} />
        </div>
      </div>
    </div>
  );
};

export default AppCard;
