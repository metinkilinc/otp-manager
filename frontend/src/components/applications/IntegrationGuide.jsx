import { useState } from 'react';
import { Code2, Copy, Check, Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const IntegrationGuide = ({ app }) => {
  const { t } = useTranslation();
  const [activeLang, setActiveLang] = useState('curl');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const apiKey = app?.apiKey || 'YOUR_API_KEY';
  const apiSecret = app?.apiSecret || 'YOUR_API_SECRET';
  const baseUrl = 'http://localhost:3500';

  const snippets = {
    curl: [
      {
        title: t('integrationGuide.step1Title'),
        code: `curl -X POST ${baseUrl}/api/v1/enroll/start \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{"externalUserId": "usr_1001", "userEmail": "kullanici@kurum.gov.tr"}'`,
      },
      {
        title: t('integrationGuide.step2Title'),
        code: `curl -X POST ${baseUrl}/api/v1/validate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{"externalUserId": "usr_1001", "code": "123456"}'`,
      },
    ],
    node: [
      {
        title: t('integrationGuide.step1Title'),
        code: `const axios = require('axios');

async function startEnrollment(userId, email) {
  const response = await axios.post('${baseUrl}/api/v1/enroll/start', {
    externalUserId: userId,
    userEmail: email
  }, {
    headers: {
      'X-API-Key': '${apiKey}',
      'Content-Type': 'application/json'
    }
  });
  console.log('QR Code URL:', response.data.data.qrCodeDataUrl);
}`,
      },
    ],
    python: [
      {
        title: t('integrationGuide.step1Title'),
        code: `import requests

def start_enrollment(user_id, email):
    url = "${baseUrl}/api/v1/enroll/start"
    headers = {
        "X-API-Key": "${apiKey}",
        "Content-Type": "application/json"
    }
    payload = {"externalUserId": user_id, "userEmail": email}
    res = requests.post(url, json=payload, headers=headers)
    print(res.json())`,
      },
    ],
    php: [
      {
        title: t('integrationGuide.step1Title'),
        code: `<?php
$ch = curl_init('${baseUrl}/api/v1/enroll/start');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ${apiKey}',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'externalUserId' => 'usr_1001',
    'userEmail' => 'kullanici@kurum.gov.tr'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
      },
    ],
  };

  const handleCopy = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    toast.success(t('toasts.copied'));
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Code2 size={18} color="#3182CE" />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
            {t('integrationGuide.quickIntegrationTitle')}
          </h3>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
        {[
          { id: 'curl', label: t('integrationGuide.cURL') },
          { id: 'node', label: t('integrationGuide.nodeJs') },
          { id: 'python', label: t('integrationGuide.python') },
          { id: 'php', label: t('integrationGuide.php') },
        ].map((lang) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => setActiveLang(lang.id)}
            style={{
              padding: '0.5rem 0.875rem', border: 'none',
              borderBottom: activeLang === lang.id ? '2px solid #3182CE' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontWeight: activeLang === lang.id ? 800 : 600,
              color: activeLang === lang.id ? '#2B6CB0' : '#718096', fontSize: '0.8125rem',
            }}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {snippets[activeLang]?.map((snip, idx) => (
          <div key={idx} style={{ background: '#1E293B', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.5rem 0.875rem', background: '#0F172A', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700,
            }}>
              <span>{snip.title}</span>
              <button
                type="button"
                onClick={() => handleCopy(snip.code, idx)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedIndex === idx ? '#10B981' : '#94A3B8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedIndex === idx ? t('common.copied') : t('common.copy')}</span>
              </button>
            </div>
            <pre style={{ margin: 0, padding: '0.875rem', color: '#38BDF8', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', overflowX: 'auto', lineHeight: 1.5 }}>
              {snip.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationGuide;
