import styles from './Badge.module.css';

const variantMap = {
  draft: 'gray',
  paid: 'green',
  archived: 'gray',
  to_cook: 'amber',
  preparing: 'blue',
  completed: 'green',
  cancelled: 'red',
  open: 'green',
  closed: 'gray',
  admin: 'amber',
  staff: 'blue',
  kitchen: 'green',
};

export default function Badge({ children, variant, status }) {
  const v = variant || variantMap[status] || 'gray';
  return <span className={[styles.badge, styles[v]].join(' ')}>{children || status}</span>;
}
