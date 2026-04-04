import { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(function Input({ label, error, type = 'text', placeholder, ...props }, ref) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={[styles.input, error ? styles.error : ''].join(' ')}
        {...props}
      />
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
});

export default Input;
