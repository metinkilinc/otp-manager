import StatusIndicator from './StatusIndicator';

const Badge = ({ type = 'info', children, showDot = false }) => {
  const classMap = {
    active: 'badge-active',
    inactive: 'badge-inactive',
    pending: 'badge-pending',
    info: 'badge-info',
    purple: 'badge-purple',
  };

  return (
    <span className={classMap[type] || 'badge-info'}>
      {showDot && type === 'active' && <StatusIndicator active size="sm" />}
      {showDot && type === 'inactive' && <StatusIndicator active={false} size="sm" />}
      {children}
    </span>
  );
};

export default Badge;
