import React from 'react';

export function DataTable({ columns, data, onRowClick, isLoading, emptyMessage = 'No data available.' }) {
  if (isLoading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  if (!data || data.length === 0) {
    return <div className="empty-state"><p>{emptyMessage}</p></div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={col.style}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRowClick && onRowClick(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
              {columns.map((col, j) => (
                <td key={j}>
                  {col.cell ? col.cell(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
