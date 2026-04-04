import styles from './ColorPicker.module.css';

const COLORS = ['#d97706', '#16a34a', '#2563eb', '#dc2626', '#7c3aed', '#db2777', '#0891b2'];

export default function ColorPicker({ value, onChange }) {
  return (
    <div className={styles.wrapper}>
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={[styles.swatch, value === c ? styles.active : ''].join(' ')}
          style={{ background: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}
