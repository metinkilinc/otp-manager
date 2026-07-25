import { useRef } from 'react';

const OTPInput = ({ value = '', onChange, disabled = false, autoFocus = false, size = 'md' }) => {
  const inputRefs = useRef([]);
  const digits = 6;

  const chars = (value + '      ').slice(0, digits).split('');

  const isSmall = size === 'sm';
  const boxWidth = isSmall ? '2.1rem' : '3rem';
  const boxHeight = isSmall ? '2.5rem' : '3.5rem';
  const boxFontSize = isSmall ? '1.125rem' : '1.5rem';
  const boxBorderRadius = isSmall ? '0.375rem' : '0.75rem';
  const gapSize = isSmall ? '0.25rem' : '0.5rem';

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;

    const newChars = [...chars];
    newChars[index] = val[val.length - 1];

    const newValue = newChars.join('').replace(/\s/g, '');
    onChange(newValue.slice(0, digits));

    if (index < digits - 1 && val) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const newChars = [...chars];
      if (newChars[index].trim()) {
        newChars[index] = ' ';
        onChange(newChars.join('').replace(/\s/g, '').slice(0, index));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const prev = [...chars];
        prev[index - 1] = ' ';
        onChange(prev.join('').replace(/\s/g, '').slice(0, index - 1));
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < digits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, digits);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, digits - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: gapSize, justifyContent: 'center' }}>
      {Array.from({ length: digits }, (_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={chars[i].trim()}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: boxWidth,
            height: boxHeight,
            textAlign: 'center',
            fontSize: boxFontSize,
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            border: '2px solid',
            borderColor: chars[i].trim() ? '#10B981' : '#CBD5E1',
            borderRadius: boxBorderRadius,
            outline: 'none',
            backgroundColor: 'white',
            color: '#1A202C',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            caretColor: 'transparent',
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.2)';
            e.target.style.borderColor = '#10B981';
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = 'none';
            if (!chars[i].trim()) {
              e.target.style.borderColor = '#CBD5E1';
            }
          }}
        />
      ))}
    </div>
  );
};

export default OTPInput;
