import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNavbar from '../components/ui/TopNavbar';
import Sidebar from '../components/ui/Sidebar';
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-surface-bg)' }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: '4px',
          border: '3px solid var(--color-primary-light)',
          borderTop: '3px solid var(--color-primary)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'inherit', borderRadius: '4px', fontSize: '0.875rem' },
          success: { iconTheme: { primary: '#10B981', secondary: 'white' } },
          error: { iconTheme: { primary: '#E53E3E', secondary: 'white' } },
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top Navbar */}
        <TopNavbar onToggleSidebar={() => setMobileOpen((v) => !v)} />

        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
          {/* Sol Sidebar */}
          <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

          {/* Ana İçerik */}
          <main style={{ flex: 1, padding: '1.5rem', minWidth: 0, overflowY: 'auto', width: '100%' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
