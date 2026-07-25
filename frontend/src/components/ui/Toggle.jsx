const Toggle = ({ checked, onChange, disabled = false, label }) => {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          position: 'relative',
          width: '2.25rem',
          height: '1.25rem',
          borderRadius: '9999px',
          border: 'none',
          backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-surface-border)',
          transition: 'background-color 0.2s',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? 'calc(100% - 18px)' : '2px',
            width: '16px',
            height: '16px',
            borderRadius: '9999px',
            backgroundColor: 'white',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
      {label && (
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Toggle;
