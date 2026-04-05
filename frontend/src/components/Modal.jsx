import React from 'react';
import { createPortal } from 'react-dom';

export function Modal({ isOpen, onClose, title, children, footer, wide = false }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => {
      if (e.target.className === 'modal-overlay') onClose();
    }}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
