import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  block = false, 
  loading = false, 
  className = '', 
  ...props 
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    block ? 'btn-block' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={loading || props.disabled} {...props}>
      {loading && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 1 }} />}
      {children}
    </button>
  );
}
