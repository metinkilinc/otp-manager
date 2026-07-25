import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Trash2, RotateCcw, User, AlertOctagon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DataTable from '../ui/DataTable';
import Badge from '../ui/Badge';
import Toggle from '../ui/Toggle';
import StatusIndicator from '../ui/StatusIndicator';
import QRCodeInspector from './QRCodeInspector';
import InspectorPanel from '../ui/InspectorPanel';
import toast from 'react-hot-toast';
import api from '../../api/client';

const EnrollmentTable = ({ appId }) => {
  const { t } = useTranslation();
  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [qrModal, setQrModal] = useState({ open: false, data: null, codes: [] });
  const [deleteModal, setDeleteModal] = useState({ open: false, enrollment: null });

  const fetchEnrollments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ appId, page, limit: 20, status });
      if (search) params.set('search', search);
      const { data } = await api.get(`/enrollments?${params}`);
      setEnrollments(data.data.enrollments);
      setPagination(data.data.pagination);
    } catch { toast.error(t('toasts.errorOccurred')); }
    finally { setLoading(false); }
  }, [appId, search, status, t]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const handleToggle = async (enrollment, value) => {
    try {
      await api.put(`/enrollments/${enrollment.id}/toggle`, { isActive: value });
      toast.success(value ? t('applicationDetail.appActivated') : t('applicationDetail.appDisabled'));
      fetchEnrollments(pagination.page);
    } catch { toast.error(t('applicationDetail.operationFailed')); }
  };

  const handleReset = async (enrollment) => {
    try {
      const { data } = await api.put(`/enrollments/${enrollment.id}/reset`);
      setQrModal({ open: true, data: data.data, codes: data.data.recoveryCodes });
      fetchEnrollments(pagination.page);
    } catch { toast.error(t('enrollments.resetFailed')); }
  };

  const handleDelete = async () => {
    if (!deleteModal.enrollment) return;
    try {
      await api.delete(`/enrollments/${deleteModal.enrollment.id}`);
      toast.success(t('toasts.savedSuccess'));
      setDeleteModal({ open: false, enrollment: null });
      fetchEnrollments(pagination.page);
    } catch { toast.error(t('applicationDetail.deleteFailed')); }
  };

  const columns = [
    {
      key: 'externalUserId', header: t('enrollments.userIdHeader'),
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {row.externalName || row.externalEmail || v}
          </div>
          {row.externalEmail && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{row.externalEmail}</div>}
          <div style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>ID: {v}</div>
        </div>
      ),
    },
    {
      key: 'isActive', header: t('common.status'),
      render: (v, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Badge type={v && row.isVerified ? 'active' : row.isVerified ? 'inactive' : 'pending'} showDot>
            {v && row.isVerified ? t('enrollments.verified') : row.isVerified ? t('applications.onlyDisabled') : t('enrollments.unverified')}
          </Badge>
        </div>
      ),
    },
    {
      key: 'lastUsedAt', header: t('enrollments.lastUsedHeader'),
      render: (v) => v ? new Date(v).toLocaleString('tr-TR') : <span style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</span>,
    },
    {
      key: 'createdAt', header: t('enrollments.createdAtHeader'),
      render: (v) => new Date(v).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions', header: t('common.actions'),
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Toggle checked={row.isActive} onChange={(val) => handleToggle(row, val)} />
          <button
            type="button"
            onClick={() => handleReset(row)}
            className="btn-ghost"
            title={t('users.reset2FATooltip')}
            style={{ padding: '0.25rem' }}
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteModal({ open: true, enrollment: row })}
            className="btn-ghost"
            style={{ padding: '0.25rem', color: 'var(--color-danger)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <input
            className="input"
            placeholder={t('enrollments.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '0.8125rem' }}
          />
        </div>
        <button type="button" onClick={() => fetchEnrollments(pagination.page)} className="btn-ghost" style={{ padding: '0.5rem' }}>
          <RefreshCw size={14} /> {t('common.refresh')}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={enrollments}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchEnrollments(p)}
      />

      {/* QR Inspector Modal */}
      {qrModal.open && (
        <QRCodeInspector
          data={qrModal.data}
          recoveryCodes={qrModal.codes}
          onClose={() => setQrModal({ open: false, data: null, codes: [] })}
        />
      )}
    </div>
  );
};

export default EnrollmentTable;
