const statusMap = {
  open:     'badge-success',
  closed:   'badge-gray',
  draft:    'badge-gray',
  sent_to_kitchen: 'badge-primary',
  preparing:'badge-warning',
  ready:    'badge-success',
  paid:     'badge-primary',
  cancelled:'badge-danger',
  active:   'badge-success',
  inactive: 'badge-gray',
  cash:     'badge-success',
  digital:  'badge-primary',
  upi:      'badge-warning',
};

export default function Badge({ status, label }) {
  const cls = statusMap[status?.toLowerCase()] || 'badge-gray';
  return (
    <span className={`badge ${cls}`}>
      {label || status}
    </span>
  );
}
