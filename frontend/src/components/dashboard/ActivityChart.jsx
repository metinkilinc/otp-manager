import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid var(--color-surface-border)',
      borderRadius: '4px', padding: '0.75rem 1rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      fontFamily: 'inherit', fontSize: '0.8125rem',
    }}>
      <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: '0.125rem 0' }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

export const WeeklyActivityChart = ({ data = [] }) => {
  const { t } = useTranslation();
  return (
    <div>
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
        {t('dashboard.weeklyTraffic')}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false}
            tickFormatter={(v) => v?.slice(5)} />
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="success" name={t('common.success')} stroke="#8B5CF6" strokeWidth={2}
            fill="url(#successGrad)" dot={{ fill: '#8B5CF6', strokeWidth: 0, r: 3 }} />
          <Area type="monotone" dataKey="fail" name={t('common.error')} stroke="#F43F5E" strokeWidth={2}
            fill="url(#failGrad)" dot={{ fill: '#F43F5E', strokeWidth: 0, r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AppUsageChart = ({ data = [] }) => {
  const { t } = useTranslation();
  return (
    <div>
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
        {t('dashboard.serviceDistribution')}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="active" name={t('common.active')} fill="#8B5CF6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyActivityChart;
