import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Smartphone, ClipboardList, Users, Settings, LogOut, Search, BarChart2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

function SidebarContent({ onClose, search, setSearch }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navCategories = [
    {
      title: t('sidebar.catGeneral'),
      items: [
        { label: t('sidebar.home'), to: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: t('sidebar.catProcesses'),
      items: [
        { label: t('sidebar.applications'), to: '/apps', icon: Smartphone },
        { label: t('sidebar.auditLogs'), to: '/audit', icon: ClipboardList },
        { label: t('sidebar.analytics'), to: '/analytics', icon: BarChart2 },
      ],
    },
    {
      title: t('sidebar.catManagement'),
      items: [
        { label: t('sidebar.users'), to: '/users', icon: Users, adminOnly: true },
        { label: t('sidebar.settings'), to: '/settings', icon: Settings },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkStyle = ({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
      
      {/* OTP MANAGER Logo */}
      <div style={{ padding: '0.875rem 0.875rem 0.375rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: '1.25rem' }}>🔐</span>
        <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#2B6CB0', letterSpacing: '-0.01em' }}>OTP MANAGER</span>
      </div>

      {/* Üst Arama Kutusu */}
      <div style={{ padding: '0.625rem 0.875rem 0.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
          <input
            className="input"
            placeholder={t('sidebar.searchMenu')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', paddingRight: '0.5rem', fontSize: '0.75rem', height: '34px', background: '#F7FAFC' }}
          />
        </div>
      </div>

      {/* Navigasyon Listesi */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {navCategories.map((cat) => {
          const visibleItems = cat.items.filter((item) => {
            if (item.adminOnly && user?.role !== 'SUPER_ADMIN') return false;
            if (!search) return true;
            return item.label.toLowerCase().includes(search.toLowerCase());
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={cat.title}>
              <div style={{ fontSize: '0.625rem', color: '#A0AEC0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.5rem 0.25rem' }}>
                {cat.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {visibleItems.map(({ label, to, icon: Icon }) => (
                  <NavLink key={label} to={to} className={linkStyle} onClick={onClose}>
                    <Icon size={16} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Alt Profil Kutusu */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-surface-border)' }}>
        <div style={{
          padding: '0.625rem',
          background: '#F7FAFC',
          borderRadius: '4px',
          border: '1px solid #E2E8F0',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '1.75rem', height: '1.75rem', borderRadius: '4px',
              background: '#3182CE', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.75rem', flexShrink: 0,
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'M'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Admin'}
              </div>
              <span className="badge-info" style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem', whiteSpace: 'nowrap' }}>
                {user?.role === 'SUPER_ADMIN' ? t('auth.superAdmin') : t('auth.user')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', padding: '0.25rem', fontSize: '0.75rem', color: '#E53E3E', background: 'white', border: '1px solid #FED7D7' }}
          >
            <LogOut size={12} /> {t('auth.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const [search, setSearch] = useState('');

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex"
        style={{
          width: '220px',
          minWidth: '220px',
          height: 'calc(100vh - 60px)',
          position: 'sticky',
          top: '60px',
          borderRight: '1px solid var(--color-surface-border)',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'white',
        }}
      >
        <SidebarContent search={search} setSearch={setSearch} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            backgroundColor: 'rgba(26,32,44,0.4)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: '240px',
          zIndex: 50,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        <SidebarContent onClose={onMobileClose} search={search} setSearch={setSearch} />
      </aside>
    </>
  );
};

export { Sidebar };
export default Sidebar;
