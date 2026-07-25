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
    dotnet: [
      {
        title: t('integrationGuide.step1Title'),
        code: `using var client = new HttpClient();
client.DefaultRequestHeaders.Add("X-API-Key", "${apiKey}");

var payload = new {
    externalUserId = "usr_1001",
    userEmail = "kullanici@kurum.gov.tr"
};
var json = JsonSerializer.Serialize(payload);
var content = new StringContent(json, Encoding.UTF8, "application/json");

var response = await client.PostAsync("${baseUrl}/api/v1/enroll/start", content);
var result = await response.Content.ReadAsStringAsync();
Console.WriteLine(result);`,
      },
      {
        title: t('integrationGuide.step2Title'),
        code: `var validatePayload = new {
    externalUserId = "usr_1001",
    code = "123456"
};
var validateJson = JsonSerializer.Serialize(validatePayload);
var validateContent = new StringContent(validateJson, Encoding.UTF8, "application/json");

var validateResponse = await client.PostAsync("${baseUrl}/api/v1/validate", validateContent);
var validateResult = await validateResponse.Content.ReadAsStringAsync();
Console.WriteLine(validateResult);`,
      },
    ],
    java: [
      {
        title: t('integrationGuide.step1Title'),
        code: `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
String body = """
    {\"externalUserId\": \"usr_1001\", \"userEmail\": \"kullanici@kurum.gov.tr\"}
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${baseUrl}/api/v1/enroll/start"))
    .header("Content-Type", "application/json")
    .header("X-API-Key", "${apiKey}")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
      },
      {
        title: t('integrationGuide.step2Title'),
        code: `String validateBody = """
    {\"externalUserId\": \"usr_1001\", \"code\": \"123456\"}
    """;

HttpRequest validateReq = HttpRequest.newBuilder()
    .uri(URI.create("${baseUrl}/api/v1/validate"))
    .header("Content-Type", "application/json")
    .header("X-API-Key", "${apiKey}")
    .POST(HttpRequest.BodyPublishers.ofString(validateBody))
    .build();

HttpResponse<String> validateRes = client.send(validateReq, HttpResponse.BodyHandlers.ofString());
System.out.println(validateRes.body());`,
      },
    ],
    go: [
      {
        title: t('integrationGuide.step1Title'),
        code: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func startEnrollment() {
    payload, _ := json.Marshal(map[string]string{
        "externalUserId": "usr_1001",
        "userEmail":      "kullanici@kurum.gov.tr",
    })
    req, _ := http.NewRequest("POST", "${baseUrl}/api/v1/enroll/start", bytes.NewBuffer(payload))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("X-API-Key", "${apiKey}")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
      },
      {
        title: t('integrationGuide.step2Title'),
        code: `func validateOTP(code string) {
    payload, _ := json.Marshal(map[string]string{
        "externalUserId": "usr_1001",
        "code":           code,
    })
    req, _ := http.NewRequest("POST", "${baseUrl}/api/v1/validate", bytes.NewBuffer(payload))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("X-API-Key", "${apiKey}")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
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

      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
        {[
          { id: 'curl', label: t('integrationGuide.cURL') },
          { id: 'node', label: t('integrationGuide.nodeJs') },
          { id: 'python', label: t('integrationGuide.python') },
          { id: 'php', label: t('integrationGuide.php') },
          { id: 'dotnet', label: t('integrationGuide.dotNet') },
          { id: 'java', label: t('integrationGuide.java') },
          { id: 'go', label: t('integrationGuide.go') },
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
