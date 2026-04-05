import React, { forwardRef } from 'react';

export const Select = forwardRef(({ 
  label, 
  error, 
  options = [], 
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label>{label}</label>}
      <select 
        ref={ref} 
        className={`input-field ${error ? 'error' : ''}`} 
        {...props}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';
