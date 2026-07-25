import { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Key,
  Shield,
  Lock,
  Save,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeaderBar from '../components/ui/PageHeaderBar';
import HelpInfoBanner from '../components/ui/HelpInfoBanner';
import GuidanceSidebar from '../components/ui/GuidanceSidebar';
import Badge from '../components/ui/Badge';
import OTPInput from '../components/ui/OTPInput';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Settings() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  // ─── Sağ Kolon 2FA State ───
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [qrData, setQrData] = useState(null); // { qrCodeDataUrl, tempSecret }
  const [verifyCodeVal, setVerifyCodeVal] = useState('');
  const [enabling2FA, setEnabling2FA] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [codesCopied, setCodesCopied] = useState(false);

  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disabling2FA, setDisabling2FA] = useState(false);

  const is2FAActive = Boolean(user?.totpEnabled || user?.isTwoFactorEnabled);

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    setLoadingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profileForm);
      if (data?.data?.user && setUser) {
        setUser((prev) => ({ ...prev, ...data.data.user }));
      }
      toast.success(t('toasts.savedSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t('toasts.errorOccurred'));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error(t('toasts.errorOccurred'));
      return;
    }
    setLoadingPass(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      toast.success(t('toasts.updatedSuccess'));
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t('toasts.errorOccurred'));
    } finally {
      setLoadingPass(false);
    }
  };

  // Sağ Kolon: 2FA Kurulumunu Başlat
  const handleStart2FASetup = async () => {
    setIsSettingUp2FA(true);
    setQrData(null);
    setVerifyCodeVal('');
    setRecoveryCodes([]);
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setQrData(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t('toasts.errorOccurred'));
      setIsSettingUp2FA(false);
    }
  };

  // Sağ Kolon: 2FA Onayla (Kod Doğrula)
  const handleConfirm2FAEnable = async () => {
    if (!verifyCodeVal || verifyCodeVal.length !== 6) return;
    setEnabling2FA(true);
    try {
      const { data } = await api.post('/auth/2fa/enable', {
        code: verifyCodeVal,
      });
      setRecoveryCodes(data.data.recoveryCodes || []);
      if (setUser) {
        setUser((prev) => ({ ...prev, totpEnabled: true, isTwoFactorEnabled: true }));
      }
      toast.success(t('settings.twoFaActivatedSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t('toasts.errorOccurred'));
    } finally {
      setEnabling2FA(false);
    }
  };

  // Sağ Kolon: 2FA Kapat
  const handleDisable2FA = async (e) => {
    if (e) e.preventDefault();
    if (!disablePassword) {
      toast.error(t('toasts.enterCurrentPassword'));
      return;
    }
    setDisabling2FA(true);
    try {
      await api.post('/auth/2fa/disable', { password: disablePassword });
      if (setUser) {
        setUser((prev) => ({ ...prev, totpEnabled: false, isTwoFactorEnabled: false }));
      }
      toast.success(t('toasts.twoFaDisabledSuccess'));
      setShowDisable2FA(false);
      setDisablePassword('');
      setIsSettingUp2FA(false);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t('toasts.twoFaDisableFailed'));
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleCopyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCodesCopied(true);
    toast.success(t('toasts.recoveryCodesCopied'));
    setTimeout(() => setCodesCopied(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
      {/* Üst Başlık Çubuğu */}
      <PageHeaderBar
        icon={SettingsIcon}
        title={t('settings.pageTitle')}
        description={t('settings.pageDesc')}
        backTo="/dashboard"
        backLabel={t('common.backToHome')}
      />

      {/* Üst Sarı Yardım Banner'ı */}
      <HelpInfoBanner
        title={t('settings.guideTitle')}
        items={[
          t('settings.guideItem1'),
          t('settings.guideItem2'),
        ]}
      />

      {/* YAN YANA (SIDE-BY-SIDE) 2-SÜTUNLU DÜZEN */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'nowrap' }}>

        {/* SOL KOLON (%68 GENİŞLİK — PROFİL, ŞİFRE VE POLİTİKA KARTLARI) */}
        <div style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Kart 1: Profil Bilgileri */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-surface-border)' }}>
              <User size={18} color="#3182CE" />
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#1A202C' }}>
                {t('settings.profileInfoTitle')}
              </h3>
            </div>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#2D3748', marginBottom: '0.375rem' }}>
                    {t('users.nameHeader')}
                  </label>
                  <input
                    className="input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#2D3748', marginBottom: '0.375rem' }}>
                    {t('auth.emailLabel')}
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={loadingProfile} style={{ fontSize: '0.8125rem' }}>
                  <Save size={14} /> {loadingProfile ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>

          {/* Kart 2: Şifre Değiştirme */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-surface-border)' }}>
              <Lock size={18} color="#D97706" />
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#1A202C' }}>
                {t('settings.changePasswordTitle')}
              </h3>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#2D3748', marginBottom: '0.375rem' }}>
                  {t('settings.currentPasswordLabel')}
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#2D3748', marginBottom: '0.375rem' }}>
                    {t('settings.newPasswordLabel')} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#718096' }}>{t('settings.newPasswordHint')}</span>
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="En az 8 karakter"
                    value={passForm.newPassword}
                    onChange={(e) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#2D3748', marginBottom: '0.375rem' }}>
                    {t('settings.confirmPasswordLabel')}
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder={t('settings.confirmPasswordPlaceholder')}
                    value={passForm.confirmPassword}
                    onChange={(e) => setPassForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-success" disabled={loadingPass} style={{ fontSize: '0.8125rem' }}>
                  <Key size={14} /> {loadingPass ? t('settings.updatingPassword') : t('settings.updatePasswordBtn')}
                </button>
              </div>
            </form>
          </div>

          {/* Kart 3: Oturum & Güvenlik Politikaları */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Shield size={18} color="#8B5CF6" />
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#1A202C' }}>
                {t('settings.sessionPoliciesTitle')}
              </h3>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#718096', lineHeight: 1.5 }}>
              {t('settings.jwtSessionDuration')}<br />
              {t('settings.bruteForceProtection')}<br />
              {t('settings.hmacWindow')}
            </div>
          </div>

        </div>

        {/* SAĞ KOLON (340px SABİT GENİŞLİK — EN ÜSTTE KULLANICI 2FA KURULUM WIDGET'I + REHBER) */}
        <div style={{ width: '340px', minWidth: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 1. SAĞ TARAFA SABİTLENMİŞ PANEL 2FA KURULUM WIDGET'I */}
          <div className="card" style={{
            borderTop: is2FAActive ? '4px solid #10B981' : isSettingUp2FA ? '4px solid #3182CE' : '4px solid #F59E0B',
            background: is2FAActive ? '#F0FDF4' : isSettingUp2FA ? '#FFFFFF' : '#FFFBEB',
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color={is2FAActive ? '#10B981' : isSettingUp2FA ? '#3182CE' : '#D97706'} />
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: is2FAActive ? '#065F46' : '#1A202C' }}>
                  📱 Panel 2FA Kurulumu
                </h3>
              </div>
              <Badge type={is2FAActive ? 'active' : 'warning'} showDot>
                {is2FAActive ? t('settings.twoFaActive') : t('settings.twoFaNotConfigured')}
              </Badge>
            </div>

            {/* DURUM 1: 2FA AKTİF VE BAĞLI */}
            {is2FAActive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#047857', lineHeight: 1.4 }}>
                  {t('settings.twoFaProtectedMessage')}
                </div>

                {!showDisable2FA ? (
                  <button
                    type="button"
                    onClick={() => setShowDisable2FA(true)}
                    className="btn-danger"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem', padding: '0.4rem' }}
                  >
                    {t('settings.disable2FA')}
                  </button>
                ) : (
                  <form onSubmit={handleDisable2FA} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      type="password"
                      className="input"
                      placeholder={t('settings.currentPasswordPlaceholder')}
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      style={{ padding: '0.4rem 0.625rem', fontSize: '0.8125rem' }}
                      required
                    />
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button type="button" onClick={() => setShowDisable2FA(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}>
                        {t('common.cancel')}
                      </button>
                      <button type="submit" className="btn-danger" disabled={disabling2FA} style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}>
                        {disabling2FA ? '...' : t('common.confirm')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : isSettingUp2FA ? (
              /* DURUM 2: CANLI SAĞ KOLON KURULUM ADIMI (QR KOD + OTP INPUT + RECOVERY CODES) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {recoveryCodes.length > 0 ? (
                  /* KURTARMA KODLARI GÖSTERİMİ */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.8125rem' }}>
                        {t('settings.twoFaActivatedSuccess')}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#047857' }}>
                        {t('settings.saveBackupCodesNotice')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#4A5568' }}>KURTARMA KODLARI</span>
                      <button type="button" onClick={handleCopyRecoveryCodes} className="btn-ghost" style={{ padding: '0.2rem 0.4rem', fontSize: '0.6875rem', color: '#3182CE' }}>
                        {codesCopied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                        {codesCopied ? t('common.copied') : t('common.copy')}
                      </button>
                    </div>

                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem',
                      background: '#F8FAFC', padding: '0.5rem', borderRadius: '4px',
                      border: '1px solid #E2E8F0', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      {recoveryCodes.map((code, idx) => (
                        <div key={idx} style={{ padding: '0.2rem 0.375rem', background: 'white', borderRadius: '2px', border: '1px solid #CBD5E1', textAlign: 'center', color: '#1A202C' }}>
                          {code}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsSettingUp2FA(false)}
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem', padding: '0.4rem' }}
                    >
                      {t('common.confirm')}
                    </button>
                  </div>
                ) : (
                  /* QR KOD TARATMA VE KOD GİRME ADIMI */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#4A5568', lineHeight: 1.4 }}>
                      {t('settings.step1ScanQr')}
                    </div>

                    {qrData?.qrCodeDataUrl && (
                      <div style={{ display: 'flex', justifyContent: 'center', background: '#F8FAFC', padding: '0.5rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                        <img src={qrData.qrCodeDataUrl} alt="2FA QR Code" style={{ width: 140, height: 140, borderRadius: '4px' }} />
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: '#4A5568', textAlign: 'center' }}>
                      {t('settings.step2EnterCode')}
                    </div>

                    <OTPInput
                      value={verifyCodeVal}
                      onChange={(val) => setVerifyCodeVal(val)}
                      size="sm"
                    />

                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsSettingUp2FA(false)}
                        className="btn-ghost"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '0.4rem' }}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirm2FAEnable}
                        className="btn-success"
                        disabled={enabling2FA || verifyCodeVal.length !== 6}
                        style={{ flex: 2, justifyContent: 'center', fontSize: '0.75rem', padding: '0.4rem' }}
                      >
                        {enabling2FA ? '...' : t('common.confirm')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* DURUM 3: 2FA HENÜZ AKTİF DEĞİL (BAŞLATMA BUTONU) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#B45309', lineHeight: 1.4 }}>
                  {t('settings.twoFa100Protection')}
                </div>

                <button
                  type="button"
                  onClick={handleStart2FASetup}
                  className="btn-success"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem', padding: '0.5rem' }}
                >
                  <QrCode size={16} /> {t('settings.start2FASetup')}
                </button>
              </div>
            )}
          </div>

          {/* 2. REHBER KUTUSU */}
          <GuidanceSidebar
            guideTitle={t('settings.sidebarGuideTitle')}
            guideText={t('settings.sidebarGuideText')}
            warningTitle={t('settings.sidebarWarningTitle')}
            warningText={t('settings.sidebarWarningText')}
            steps={[
              t('settings.step1'),
              t('settings.step2'),
              t('settings.step3'),
              t('settings.step4'),
            ]}
          />
        </div>

      </div>
    </div>
  );
}
