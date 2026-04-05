import React, { forwardRef } from 'react';

export const Input = forwardRef(({ 
  label, 
  error, 
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label>{label}</label>}
      <input 
        ref={ref} 
        className={`input-field ${error ? 'error' : ''}`} 
        {...props} 
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
