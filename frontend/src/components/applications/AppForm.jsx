import { useState, useEffect } from 'react';
import InspectorPanel from '../ui/InspectorPanel';
import Toggle from '../ui/Toggle';
import { Smartphone, Layers, Globe, AlignLeft, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../api/client';

const AppForm = ({ isOpen, onClose, onSaved, editApp = null }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '', slug: '', domain: '', description: '', force2FA: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editApp) {
      setForm({
        name: editApp.name || '',
        slug: editApp.slug || '',
        domain: editApp.domain || '',
        description: editApp.description || '',
        force2FA: editApp.force2FA || false,
      });
    } else {
      setForm({ name: '', slug: '', domain: '', description: '', force2FA: false });
    }
  }, [editApp, isOpen]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase()
      .replace(/[çÇ]/g, 'c').replace(/[ğĞ]/g, 'g')
      .replace(/[ıİ]/g, 'i').replace(/[öÖ]/g, 'o')
      .replace(/[şŞ]/g, 's').replace(/[üÜ]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm((f) => ({ ...f, name, ...(!editApp ? { slug } : {}) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editApp) {
        await api.put(`/admin/applications/${editApp.id}`, {
          name: form.name, domain: form.domain || null,
          description: form.description || null, force2FA: form.force2FA,
        });
        toast.success(t('toasts.updatedSuccess'));
      } else {
        await api.post('/admin/applications', form);
        toast.success(t('appCreate.saveSuccessToast'));
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t('applicationDetail.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <InspectorPanel
      isOpen={isOpen}
      onClose={onClose}
      title={editApp ? t('common.edit') : t('applications.newAppBtn')}
      subtitle={editApp ? `ID: ${editApp.id}` : t('appCreate.pageDesc')}
      icon={Smartphone}
      width="460px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
            {t('appCreate.appNameLabel')}
          </label>
          <input
            className="input"
            placeholder={t('appCreate.appNamePlaceholder')}
            value={form.name}
            onChange={handleNameChange}
            required
          />
        </div>

        {!editApp && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
              {t('appCreate.slugLabel')}
            </label>
            <input
              className="input"
              placeholder="obs"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
              pattern="[a-z0-9\-_]+"
              required
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
            {t('appCreate.domainLabel')}
          </label>
          <input
            className="input"
            placeholder={t('appCreate.domainPlaceholder')}
            value={form.domain}
            onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
            {t('appCreate.descLabel')}
          </label>
          <textarea
            className="input"
            placeholder={t('appCreate.descPlaceholder')}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            style={{ resize: 'vertical', minHeight: '80px' }}
          />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem', background: 'var(--color-purple-light)',
          borderRadius: '6px', border: '1px solid #EFECFD',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-purple)' }}>{t('applications.force2FA')}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-gray)' }}>{t('applicationDetail.policy2FADesc')}</div>
          </div>
          <Toggle checked={form.force2FA} onChange={(v) => setForm((f) => ({ ...f, force2FA: v }))} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-surface-border)' }}>
          <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
            {loading ? t('common.saving') : editApp ? t('common.save') : t('common.add')}
          </button>
        </div>
      </form>
    </InspectorPanel>
  );
};

export default AppForm;
