import styles from './DataTable.module.css';

export default function DataTable({ columns, rows, onRowClick, emptyText = 'No data found', loading }) {
  if (loading) return <div className={styles.empty}>Loading...</div>;
  if (!rows?.length) return <div className={styles.empty}>{emptyText}</div>;

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={styles.th} style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id || i}
              className={[styles.tr, onRowClick ? styles.clickable : ''].join(' ')}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={styles.td}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
