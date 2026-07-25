import { useState, useEffect } from 'react';
import { Users as UsersIcon, UserPlus, Unlock, RefreshCw, Trash2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeaderBar from '../components/ui/PageHeaderBar';
import HelpInfoBanner from '../components/ui/HelpInfoBanner';
import GuidanceSidebar from '../components/ui/GuidanceSidebar';
import Badge from '../components/ui/Badge';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.data.users || []);
    } catch {
      toast.error(t('toasts.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    if (e) e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error(t('common.required'));
      return;
    }
    setSubmitLoading(true);
    try {
      await api.post('/admin/users', form);
      toast.success(t('toasts.userCreated'));
      setForm({ name: '', email: '', password: '', role: 'USER' });
      setShowCreate(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t('toasts.errorOccurred'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUnlock = async (id, name) => {
    try {
      await api.post(`/admin/users/${id}/unlock`);
      toast.success(t('users.unlockSuccess', { name }));
      fetchUsers();
    } catch {
      toast.error(t('users.unlockFailed'));
    }
  };

  const handleReset2FA = async (id, name) => {
    if (!window.confirm(t('users.confirmReset', { name }))) return;
    try {
      await api.post(`/admin/users/${id}/reset-2fa`);
      toast.success(t('users.resetSuccess', { name }));
      fetchUsers();
    } catch {
      toast.error(t('users.resetFailed'));
    }
  };

  const [deletingUserId, setDeletingUserId] = useState(null);

  const handleDelete = async (id, name) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success(t('users.deleteSuccess', { name }));
      setDeletingUserId(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t('users.deleteFailed'));
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
      {/* Üst Başlık Çubuğu */}
      <PageHeaderBar
        icon={UsersIcon}
        title={t('users.pageTitle')}
        description={t('users.pageDesc')}
        backTo="/dashboard"
        backLabel={t('common.backToHome')}
      />

      {/* Üst Sarı Yardım Banner'ı */}
      <HelpInfoBanner
        title={t('users.guideTitle')}
        items={[
          t('users.bannerItem1'),
          t('users.bannerItem2'),
        ]}
      />

      {/* YAN YANA (SIDE-BY-SIDE) 2-SÜTUNLU DÜZEN */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
        
        {/* SOL KOLON (%68 GENİŞLİK — TABLO VE EKLEME FORMU) */}
        <div style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Ekleme Formu Aç/Kapat Butonu Barı */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: '2.25rem', height: '2.25rem', borderRadius: '4px',
                background: '#EBF8FF', color: '#3182CE', border: '1px solid #BEE3F8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <UsersIcon size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1A202C' }}>
                  {t('users.registeredMembers', { count: users.length })}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#718096' }}>
                  {t('users.membersSub')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="btn-primary"
              style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
            >
              <UserPlus size={16} /> {showCreate ? t('users.closeForm') : t('users.addNewManager')}
            </button>
          </div>

          {/* Yeni Kullanıcı Oluşturma Form Kartı */}
          {showCreate && (
            <div className="card" style={{ borderTop: '4px solid #3182CE', animation: 'fadeIn 0.2s ease-out' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', fontWeight: 800, color: '#1A202C', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <UserPlus size={16} color="#3182CE" /> {t('users.createFormTitle')}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#2D3748', marginBottom: '0.375rem' }}>
                    {t('users.nameHeader')} *
                  </label>
                  <input
                    className="input"
                    placeholder={t('users.namePlaceholder')}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#2D3748', marginBottom: '0.375rem' }}>
                    {t('auth.emailLabel')} *
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="user@yourcompany.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#2D3748', marginBottom: '0.375rem' }}>
                    {t('auth.passwordLabel')} * <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#718096' }}>{t('users.passwordHint')}</span>
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#2D3748', marginBottom: '0.375rem' }}>
                    {t('users.roleLabel')}
                  </label>
                  <select
                    className="input"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  >
                    <option value="USER">{t('users.userRoleOption')}</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Tam Yetkili)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost" style={{ fontSize: '0.8125rem' }}>
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={handleCreateUser} className="btn-success" disabled={submitLoading} style={{ fontSize: '0.8125rem' }}>
                  {submitLoading ? t('users.savingUser') : t('users.saveUserBtn')}
                </button>
              </div>
            </div>
          )}

          {/* Arama Barı */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
            <input
              className="input"
              placeholder={t('users.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.75rem', background: 'white' }}
            />
          </div>

          {/* Kullanıcılar Tablosu Kartı (Hizalanmış Sütunlar ve Genişlikler) */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>{t('common.loading')}</div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>{t('common.noRecord')}</div>
            ) : (
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '38%' }}>{t('users.userIdHeader')}</th>
                    <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '17%' }}>{t('users.role')}</th>
                    <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '15%' }}>2FA {t('common.status')}</th>
                    <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', width: '15%' }}>{t('users.lockStatusHeader')}</th>
                    <th style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568', textAlign: 'right', width: '15%' }}>{t('users.actionsHeader')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'normal' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{
                            width: '2rem', height: '2rem', borderRadius: '4px',
                            background: '#3182CE', color: 'white', fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem',
                          }}>
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#1A202C', fontSize: '0.875rem' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#718096' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Badge type={u.role === 'SUPER_ADMIN' ? 'purple' : 'info'}>
                          {u.role}
                        </Badge>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Badge type={u.isTwoFactorEnabled ? 'active' : 'warning'}>
                          {u.isTwoFactorEnabled ? t('common.active') : t('users.notConfigured')}
                        </Badge>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        {u.lockedUntil && new Date(u.lockedUntil) > new Date() ? (
                          <Badge type="danger" showDot>Kilitli (5 Hata)</Badge>
                        ) : (
                          <Badge type="active">Normal</Badge>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.375rem' }}>
                          {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                            <button
                              type="button"
                              onClick={() => handleUnlock(u.id, u.name)}
                              className="btn-ghost"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#D97706' }}
                              title={t('users.unlockTooltip')}
                            >
                              <Unlock size={14} /> {t('users.unlockBtn')}
                            </button>
                          )}

                          {u.isTwoFactorEnabled && (
                            <button
                              type="button"
                              onClick={() => handleReset2FA(u.id, u.name)}
                              className="btn-ghost"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#3182CE' }}
                              title={t('users.reset2FATooltip')}
                            >
                              <RefreshCw size={14} /> {t('users.reset2FABtn')}
                            </button>
                          )}

                          {u.role !== 'SUPER_ADMIN' && (
                            deletingUserId === u.id ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '4px', padding: '0.2rem 0.4rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B' }}>{t('applicationDetail.deleteConfirm')}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(u.id, u.name)}
                                  style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: '3px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  {t('common.delete')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingUserId(null)}
                                  style={{ background: '#CBD5E1', color: '#334155', border: 'none', borderRadius: '3px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  {t('common.cancel')}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingUserId(u.id)}
                                className="btn-ghost"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#E53E3E' }}
                                title={t('users.deleteTooltip')}
                              >
                                <Trash2 size={14} />
                              </button>
                            )
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

        {/* SAĞ KOLON: SAĞ TARAFTA YAN YANA BİLGİLENDİRME NOTLARI (340px Sabit Genişlik) */}
        <div style={{ width: '340px', minWidth: '340px', flexShrink: 0 }}>
          <GuidanceSidebar
            guideTitle={t('users.sidebarGuideTitle')}
            guideText={t('users.sidebarGuideText')}
            warningTitle={t('users.sidebarWarningTitle')}
            warningText={t('users.sidebarWarningText')}
            steps={[
              t('users.step1'),
              t('users.step2'),
              t('users.step3'),
              t('users.step4'),
            ]}
            onSubmit={() => setShowCreate(true)}
            submitLabel={t('users.submitLabel')}
          />
        </div>

      </div>
    </div>
  );
}
