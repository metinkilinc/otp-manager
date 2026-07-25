import { useState, useRef, useEffect } from 'react';
import { Shield, Bell, Menu, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import LanguageSelector from './LanguageSelector';

const TopNavbar = ({ onToggleSidebar }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenDropdown = () => {
    setDropdownOpen((v) => !v);
    if (!dropdownOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <header className="top-navbar">
      {/* Sol OTP MANAGER Başlığı + Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '1.875rem', height: '1.875rem', borderRadius: '4px',
            background: '#3182CE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
          }}>
            <Shield size={16} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#2B6CB0', letterSpacing: '-0.02em' }}>
            OTP MANAGER
          </span>
        </div>

        <div style={{ height: '24px', width: '1px', background: '#E2E8F0' }} />

        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn-ghost"
          style={{ padding: '0.375rem' }}
          title={t('sidebar.searchMenu')}
        >
          <Menu size={18} color="#4A5568" />
        </button>
      </div>

      {/* Sağ Profil, Dil Seçici & Canlı Bildirim Menüsü */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Dil Seçici (TR / EN) */}
        <LanguageSelector />

        <div style={{ height: '20px', width: '1px', background: '#E2E8F0' }} />
        {/* Canlı Bildirim Zili + Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={handleOpenDropdown}
            className="btn-ghost"
            style={{ position: 'relative', padding: '0.5rem', borderRadius: '4px' }}
            title={t('topNavbar.notifications')}
          >
            <Bell size={18} color="#4A5568" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                minWidth: '16px', height: '16px', borderRadius: '9999px',
                background: '#E53E3E', color: 'white', fontSize: '0.625rem',
                fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Bildirim Dropdown Kutusu */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: '340px', background: 'white', border: '1px solid #CBD5E1',
              borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              zIndex: 100, display: 'flex', flexDirection: 'column',
              animation: 'fadeIn 0.15s ease-out',
            }}>
              <div style={{
                padding: '0.75rem 1rem', background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#1A202C', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Bell size={15} color="#3182CE" />
                  <span>{t('topNavbar.notifications')}</span>
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearNotifications}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E53E3E', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0', fontSize: '0.8125rem' }}>
                    {t('common.noData')}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid #F1F5F9',
                      background: n.read ? 'white' : '#EFF6FF',
                      display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
                    }}>
                      <div style={{ marginTop: '2px', flexShrink: 0 }}>
                        {n.type === 'success' ? <CheckCircle2 size={16} color="#10B981" /> : n.type === 'error' ? <AlertCircle size={16} color="#E53E3E" /> : <Smartphone size={16} color="#3182CE" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#1A202C' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#4A5568', marginTop: '0.125rem', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#A0AEC0', marginTop: '0.25rem' }}>
                          {new Date(n.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ height: '20px', width: '1px', background: '#E2E8F0' }} />

        {/* Kullanıcı Profili */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#1A202C', lineHeight: 1.1 }}>
              {user?.name || 'Admin'}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#718096', fontWeight: 600 }}>
              {user?.role === 'SUPER_ADMIN' ? t('auth.superAdmin') : t('auth.user')}
            </span>
          </div>

          <div style={{
            width: '2.25rem', height: '2.25rem', borderRadius: '9999px',
            background: '#3182CE', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.875rem',
            border: '2px solid #EBF8FF',
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'M'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
