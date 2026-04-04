import styles from './Button.module.css';

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, onClick, type = 'button', fullWidth = false
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : ''
      ].join(' ')}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}
