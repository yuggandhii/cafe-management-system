import { forwardRef } from 'react';
import styles from './Input.module.css';

const Select = forwardRef(function Select({ label, error, options = [], placeholder, ...props }, ref) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <select
        ref={ref}
        className={[styles.input, error ? styles.error : ''].join(' ')}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
});

export default Select;
