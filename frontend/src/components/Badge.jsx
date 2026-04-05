import React from 'react';

export function Badge({ children, variant = 'draft', className = '' }) {
  // Validate basic built-in variants, fallback to default coloring if needed
  const variantClass = `badge-${variant.toLowerCase()}`;
  
  return (
    <span className={`badge ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
