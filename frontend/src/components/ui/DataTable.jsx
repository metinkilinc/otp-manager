import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * DataTable — masaüstünde normal tablo, mobilde kart listesi
 */
const DataTable = ({
  columns,
  data,
  loading = false,
  emptyMessage,
  pagination,
  onPageChange,
  selectable = false,
  selectedIds = [],
  onSelectChange,
  rowKey = 'id',
}) => {
  const { t } = useTranslation();
  const [mobileBreak] = useState(768);

  const displayEmpty = emptyMessage || t('common.noRecord');

  const toggleSelect = (id) => {
    if (!onSelectChange) return;
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    onSelectChange(newSelected);
  };

  const toggleSelectAll = () => {
    if (!onSelectChange) return;
    if (selectedIds.length === data.length) {
      onSelectChange([]);
    } else {
      onSelectChange(data.map((row) => row[rowKey]));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <div style={{
          width: 32, height: 32, margin: '0 auto 1rem',
          borderRadius: '9999px',
          border: '3px solid var(--color-primary-light)',
          borderTop: '3px solid var(--color-primary)',
          animation: 'spin 0.8s linear infinite',
        }} />
        {t('common.loading')}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        {displayEmpty}
      </div>
    );
  }

  return (
    <div>
      {/* Mobil: kart listesi */}
      <div className="md:hidden">
        {data.map((row) => (
          <div key={row[rowKey]} className="mobile-card" style={{ marginBottom: '0.75rem' }}>
            {selectable && (
              <div style={{ marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(row[rowKey])}
                  onChange={() => toggleSelect(row[rowKey])}
                />
              </div>
            )}
            {columns.map((col) => (
              <div key={col.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {col.header}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', textAlign: 'right' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop: tablo */}
      <div className="hidden md:block" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
              {selectable && (
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} style={{
                  padding: '0.75rem 1rem',
                  textAlign: col.align || 'left',
                  color: 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={row[rowKey]}
                style={{
                  borderBottom: '1px solid var(--color-surface-border)',
                  backgroundColor: selectedIds.includes(row[rowKey]) ? 'var(--color-primary-50)' : 'transparent',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!selectedIds.includes(row[rowKey])) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-50)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedIds.includes(row[rowKey])) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {selectable && (
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row[rowKey])}
                      onChange={() => toggleSelect(row[rowKey])}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} style={{
                    padding: '0.75rem 1rem',
                    textAlign: col.align || 'left',
                    color: 'var(--color-text-primary)',
                  }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 0 0',
          borderTop: '1px solid var(--color-surface-border)',
          marginTop: '0.5rem',
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {pagination.total} • {pagination.page}/{pagination.totalPages}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-ghost"
              style={{ padding: '0.5rem', opacity: pagination.page <= 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-ghost"
              style={{ padding: '0.5rem', opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
