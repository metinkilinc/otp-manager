import { useState, useEffect } from 'react';
import { Bot, Sparkles, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CopyButton from '../ui/CopyButton';

/**
 * AiPromptGenerator — Yazılımların 5 saniyede TOTP 2FA entegre edebilmesi için
 * canlı API Key ve Secret içeren Otomatik AI Prompt Üreteci.
 */
const AiPromptGenerator = ({ app }) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const serviceUrl = window.location.origin.replace('5173', '3500');
  const apiKey = app?.apiKey || 'otp_demo_key_123';
  const rawSecret = app?.apiSecret;
  const hasSecret = rawSecret && rawSecret !== 'undefined' && rawSecret !== 'null';
  const apiSecret = hasSecret ? rawSecret : 'OTP_API_SECRET_BURAYA';
  const appName = app?.name || 'Uygulamam';

  const trLines = [
    `Görev: Mevcut projeye — "${appName}" uygulamasına — aşağıdaki "OTP Manager" merkezi servisi üzerinden TOTP 2FA (Google Authenticator) zorunlu giriş akışını entegre et.`,
    `Sen uzman bir Full-Stack Yazılım Geliştiricisisin. Mevcut projenin tüm dosyalarını incele, login sistemini tespit et ve aşağıdaki akışa uygun kod yaz.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔑 SERVİS BİLGİLERİ`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `OTP Servis URL   : ${serviceUrl}`,
    `Uygulama Adı     : ${appName}`,
    `API Key          : ${apiKey}`,
    `API Secret       : ${apiSecret}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🛡️ HMAC İMZALAMA KURALI (TÜM İSTEKLERDE ZORUNLU)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Her API isteğinde şu 4 header gönderilmeli:`,
    `  Content-Type : application/json`,
    `  X-API-Key    : ${apiKey}`,
    `  X-Timestamp  : Math.floor(Date.now() / 1000).toString()`,
    `  X-Signature  : HMAC-SHA256(JSON.stringify(body) + timestamp, "${apiSecret}") → hex`,
    ``,
    `⚠️ body mutlaka JSON.stringify() ile string'e çevrilmeli.`,
    `   imza = hmac_sha256(JSON.stringify(body) + timestamp, apiSecret)`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🚀 ZORUNLU GİRİŞ AKIŞI (3 ADIM)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Kullanıcı email + şifre girer`,
    `       ↓`,
    `Kullanıcının 2FA durumu kontrol edilir:`,
    `  ├─ 2FA kurulmamış → OTP Manager'dan QR al → SETUP_2FA ekranı`,
    `  └─ 2FA kurulu    → VERIFY_2FA ekranı (6 haneli kod)`,
    `       ↓`,
    `2FA doğrulandıktan SONRA oturum token'ı üretilir`,
    `⛔ Token, şifre doğru olsa bile 2FA tamamlanmadan VERİLMEZ.`,
    ``,
    `─────────────────────────────────────────`,
    `ADIM 2a — 2FA Kurulmamış Kullanıcı (SETUP_2FA):`,
    `─────────────────────────────────────────`,
    `1. OTP Manager'a kayıt isteği gönder:`,
    `   POST ${serviceUrl}/api/v1/totp/enroll`,
    `   Header'lar: Content-Type, X-API-Key, X-Timestamp, X-Signature`,
    `   Body: { "userId": "<kullanici_id>", "email": "<email>", "name": "<ad_soyad>" }`,
    ``,
    `2. Dönen veriden "qrCodeDataUrl" ve "recoveryCodes" al.`,
    `3. Kullanıcıya QR kodunu göster ve kurtarma kodlarını yedeklemesini söyle.`,
    `4. Kullanıcının Authenticator'dan girdiği ilk 6 haneli doğrulama kodunu al ve aktive et:`,
    `   POST ${serviceUrl}/api/v1/totp/verify`,
    `   Body: { "userId": "<kullanici_id>", "token": "123456" }`,
    `5. Doğrulama başarılıysa 2FA aktifleştirilmiş olur, kullanıcının oturumunu başlat.`,
    ``,
    `─────────────────────────────────────────`,
    `ADIM 2b — 2FA Kurulu Kullanıcı (VERIFY_2FA):`,
    `─────────────────────────────────────────`,
    `1. Kullanıcıdan Google Authenticator'daki 6 haneli canlı kodu iste.`,
    `2. OTP Manager'a doğrulama isteği at:`,
    `   POST ${serviceUrl}/api/v1/totp/validate`,
    `   Body: { "userId": "<kullanici_id>", "token": "123456" }`,
    `3. Cevap { "valid": true } ise girişi onayla ve JWT/Session token ver.`,
    `4. Cevap { "valid": false } veya { "error": "ACCOUNT_LOCKED" } ise uygun hata mesajını göster.`,
    ``,
    `─────────────────────────────────────────`,
    `ADIM 3 — Kurtarma Kodu Kullanımı (RECOVERY):`,
    `─────────────────────────────────────────`,
    `1. Kullanıcı "Telefonuma erişemiyorum" dediğinde 8 haneli kurtarma kodunu al.`,
    `2. OTP Manager'a gönder:`,
    `   POST ${serviceUrl}/api/v1/totp/recovery`,
    `   Body: { "userId": "<kullanici_id>", "recoveryCode": "ABCD-EFGH" }`,
    `3. Cevap { "recovered": true } ise girişe izin ver.`,
    ``,
    `Lütfen mevcut projenin diline ve mimarisine (Node.js, Express, React, Python, Django, PHP, Spring Boot, .NET) tam uyumlu, temiz, modüler ve güvenli kod yaz.`,
  ];

  const enLines = [
    `Task: Integrate mandatory TOTP 2FA (Google Authenticator) login flow into current project for application "${appName}" using Central "OTP Manager" service.`,
    `You are an expert Full-Stack Software Engineer. Inspect existing codebase, locate auth system, and implement 2FA following this specifications.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔑 SERVICE CREDENTIALS`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `OTP Service URL   : ${serviceUrl}`,
    `App Name         : ${appName}`,
    `API Key          : ${apiKey}`,
    `API Secret       : ${apiSecret}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🛡️ HMAC SIGNING RULE (MANDATORY FOR ALL REQUESTS)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Include these 4 HTTP headers on every request:`,
    `  Content-Type : application/json`,
    `  X-API-Key    : ${apiKey}`,
    `  X-Timestamp  : Math.floor(Date.now() / 1000).toString()`,
    `  X-Signature  : HMAC-SHA256(JSON.stringify(body) + timestamp, "${apiSecret}") → hex`,
    ``,
    `⚠️ Note: body must be stringified with JSON.stringify() before hashing.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🚀 MANDATORY LOGIN FLOW (3 STEPS)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `User enters email + password`,
    `       ↓`,
    `Check user's 2FA status:`,
    `  ├─ Not configured → Fetch QR from OTP Manager → SETUP_2FA screen`,
    `  └─ Configured     → VERIFY_2FA screen (6-digit TOTP)`,
    `       ↓`,
    `Generate session JWT ONLY AFTER 2FA is verified`,
    `⛔ Session token MUST NOT be issued prior to 2FA completion.`,
    ``,
    `─────────────────────────────────────────`,
    `STEP 2a — Unconfigured User (SETUP_2FA):`,
    `─────────────────────────────────────────`,
    `1. Send enrollment request to OTP Manager:`,
    `   POST ${serviceUrl}/api/v1/totp/enroll`,
    `   Headers: Content-Type, X-API-Key, X-Timestamp, X-Signature`,
    `   Body: { "userId": "<user_id>", "email": "<email>", "name": "<name>" }`,
    `2. Extract "qrCodeDataUrl" and "recoveryCodes".`,
    `3. Display QR code to user and request backup of recovery codes.`,
    `4. Activate user with initial 6-digit TOTP code:`,
    `   POST ${serviceUrl}/api/v1/totp/verify`,
    `   Body: { "userId": "<user_id>", "token": "123456" }`,
    ``,
    `─────────────────────────────────────────`,
    `STEP 2b — Configured User (VERIFY_2FA):`,
    `─────────────────────────────────────────`,
    `1. Request 6-digit TOTP code from user.`,
    `2. Validate with OTP Manager:`,
    `   POST ${serviceUrl}/api/v1/totp/validate`,
    `   Body: { "userId": "<user_id>", "token": "123456" }`,
    `3. If { "valid": true }, grant login and issue JWT session.`,
    ``,
    `─────────────────────────────────────────`,
    `STEP 3 — Recovery Code Login (RECOVERY):`,
    `─────────────────────────────────────────`,
    `1. Send 8-character recovery code to OTP Manager:`,
    `   POST ${serviceUrl}/api/v1/totp/recovery`,
    `   Body: { "userId": "<user_id>", "recoveryCode": "ABCD-EFGH" }`,
    ``,
    `Please generate complete, production-ready code matching current tech stack.`,
  ];

  const currentLines = isEn ? enLines : trLines;
  const promptText = currentLines.join('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Üst Kart */}
      <div className="card" style={{ borderTop: '4px solid #7C3AED' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '4px', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {t('aiPrompt.title')}
              </h3>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                {t('aiPrompt.subtitle')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CopyButton text={promptText} label={t('aiPrompt.copyPromptBtn')} className="btn-purple" />
          </div>
        </div>

        {!hasSecret && (
          <div style={{
            marginTop: '0.875rem', padding: '0.625rem 0.875rem', borderRadius: '4px',
            background: '#FFFBEB', border: '1px solid #FDE68A', color: '#B45309',
            fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <AlertTriangle size={15} color="#D97706" style={{ flexShrink: 0 }} />
            <span>API Secret henüz oluşturulmamışsa Servis Ayarlarından yeni anahtar üretebilirsiniz.</span>
          </div>
        )}
      </div>

      {/* Prompt Önizleme Kartı */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#1E1B4B', border: '1px solid #4338CA' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.625rem 1rem', background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.1)',
          color: '#A5B4FC', fontSize: '0.75rem', fontWeight: 700,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Sparkles size={14} color="#7C3AED" />
            <span>{isEn ? t('aiPrompt.enPromptTab') : t('aiPrompt.trPromptTab')}</span>
          </div>
          <CopyButton text={promptText} label={t('common.copy')} />
        </div>
        <pre style={{
          margin: 0, padding: '1.25rem', color: '#C7D2FE', fontSize: '0.8125rem',
          fontFamily: 'var(--font-mono)', whitespace: 'pre-wrap', wordBreak: 'break-word',
          lineHeight: 1.6, maxHeight: '520px', overflowY: 'auto',
        }}>
          {promptText}
        </pre>
      </div>
    </div>
  );
};

export default AiPromptGenerator;
