import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/AdminLayout';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import api from '../../api/axios';

const FRONTEND_URL = window.location.origin;

function QrLinkModal({ table, onClose }) {
  const selfOrderUrl = `${FRONTEND_URL}/s/${table.qr_token}`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(selfOrderUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen title={`Self-Order Link — Table ${table.table_number}`} onClose={onClose}
      footer={<button className="btn btn-secondary" onClick={onClose}>Close</button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        {/* QR Code rendered via public API */}
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selfOrderUrl)}&format=png`}
          alt="QR Code"
          style={{ border: '2px solid #e5e7eb', padding: 8, width: 200, height: 200 }}
        />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Table {table.table_number}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
            Customers scan this QR to order from their phone
          </p>
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            padding: '8px 12px',
            fontSize: 12,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            marginBottom: 12,
            textAlign: 'left',
          }}>
            {selfOrderUrl}
          </div>
          <button className="btn btn-primary btn-sm" onClick={copy}>
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 8 }}
            onClick={() => window.open(selfOrderUrl, '_blank')}
          >
            🔗 Open Preview
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function FloorsManagement() {
  const toast = useToast();
  const qc = useQueryClient();
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [floorModal, setFloorModal] = useState(null);
  const [tableModal, setTableModal] = useState(null);
  const [qrModal, setQrModal] = useState(null);
  const [floorForm, setFloorForm] = useState({ name: '' });
  const [tableForm, setTableForm] = useState({ table_number: '', seats: 4 });

  const { data: floors } = useQuery({
    queryKey: ['floors'],
    queryFn: () => api.get('/floors').then((r) => r.data.data),
  });

  const { data: tables } = useQuery({
    queryKey: ['floor-tables', selectedFloor],
    queryFn: () => api.get(`/floors/${selectedFloor}/tables`).then((r) => r.data.data),
    enabled: !!selectedFloor,
  });

  const saveFloor = useMutation({
    mutationFn: (d) => floorModal?.id ? api.put(`/floors/${floorModal.id}`, d) : api.post('/floors', d),
    onSuccess: () => { qc.invalidateQueries(['floors']); toast.success('Floor saved'); setFloorModal(null); },
    onError: () => toast.error('Failed'),
  });

  const delFloor = useMutation({
    mutationFn: (id) => api.delete(`/floors/${id}`),
    onSuccess: () => { qc.invalidateQueries(['floors']); toast.success('Floor deleted'); setSelectedFloor(null); },
    onError: () => toast.error('Failed — remove tables first'),
  });

  const saveTable = useMutation({
    mutationFn: (d) => tableModal?.id
      ? api.put(`/floors/tables/${tableModal.id}`, d)
      : api.post(`/floors/${selectedFloor}/tables`, d),
    onSuccess: () => { qc.invalidateQueries(['floor-tables', selectedFloor]); toast.success('Table saved'); setTableModal(null); },
    onError: () => toast.error('Failed'),
  });

  const delTable = useMutation({
    mutationFn: (id) => api.delete(`/floors/tables/${id}`),
    onSuccess: () => { qc.invalidateQueries(['floor-tables', selectedFloor]); toast.success('Table deleted'); },
    onError: () => toast.error('Failed'),
  });

  return (
    <AdminLayout title="Floors & Tables" actions={
      <button className="btn btn-primary btn-sm" onClick={() => { setFloorForm({ name: '' }); setFloorModal({ mode: 'add' }); }}>
        + Add Floor
      </button>
    }>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* Floor list */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header"><span className="card-title">Floors</span></div>
          <div style={{ padding: '8px 0' }}>
            {(floors || []).map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedFloor(f.id)}
                style={{
                  padding: '9px 16px',
                  cursor: 'pointer',
                  background: selectedFloor === f.id ? 'var(--primary-light)' : 'transparent',
                  borderLeft: selectedFloor === f.id ? '3px solid var(--primary)' : '3px solid transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: selectedFloor === f.id ? 600 : 400 }}>{f.name}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); setFloorForm({ name: f.name }); setFloorModal({ mode: 'edit', id: f.id }); }}>✏️</button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); delFloor.mutate(f.id); }}>🗑️</button>
                </div>
              </div>
            ))}
            {(floors || []).length === 0 && <div className="empty-state" style={{ padding: 20, fontSize: 12 }}>No floors</div>}
          </div>
        </div>

        {/* Tables */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <span className="card-title">Tables {selectedFloor ? '' : '— Select a floor'}</span>
            {selectedFloor && (
              <button className="btn btn-primary btn-sm" onClick={() => { setTableForm({ table_number: '', seats: 4 }); setTableModal({ mode: 'add' }); }}>
                + Add Table
              </button>
            )}
          </div>
          {!selectedFloor ? (
            <div className="empty-state">← Select a floor to manage its tables</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Table #</th>
                  <th>Seats</th>
                  <th>Active</th>
                  <th>Self-Order QR</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(tables || []).map((t) => (
                  <tr key={t.id}>
                    <td><strong>T{t.table_number}</strong></td>
                    <td>{t.seats} seats</td>
                    <td style={{ color: t.active ? 'var(--success)' : 'var(--danger)' }}>
                      {t.active !== false ? '✓ Active' : '✗ Inactive'}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setQrModal(t)}
                        title="View QR Code & Self-Order Link"
                      >
                        📱 QR Code
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setTableForm({ table_number: t.table_number, seats: t.seats }); setTableModal({ mode: 'edit', id: t.id }); }}
                        >
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => delTable.mutate(t.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(tables || []).length === 0 && (
                  <tr><td colSpan={5}><div className="empty-state">No tables on this floor</div></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* QR Code modal */}
      {qrModal && <QrLinkModal table={qrModal} onClose={() => setQrModal(null)} />}

      {/* Floor modal */}
      <Modal isOpen={!!floorModal} onClose={() => setFloorModal(null)} title={floorModal?.mode === 'edit' ? 'Edit Floor' : 'Add Floor'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setFloorModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => saveFloor.mutate(floorForm)} disabled={saveFloor.isPending}>Save</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Floor Name</label>
          <input className="form-input" value={floorForm.name} onChange={(e) => setFloorForm({ name: e.target.value })} placeholder="Ground Floor" />
        </div>
      </Modal>

      {/* Table modal */}
      <Modal isOpen={!!tableModal} onClose={() => setTableModal(null)} title={tableModal?.mode === 'edit' ? 'Edit Table' : 'Add Table'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setTableModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => saveTable.mutate(tableForm)} disabled={saveTable.isPending}>Save</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Table Number</label>
            <input className="form-input" value={tableForm.table_number} onChange={(e) => setTableForm((p) => ({ ...p, table_number: e.target.value }))} placeholder="T1" />
          </div>
          <div className="form-group">
            <label className="form-label">Seats</label>
            <input type="number" className="form-input" value={tableForm.seats} onChange={(e) => setTableForm((p) => ({ ...p, seats: parseInt(e.target.value) }))} min="1" max="20" />
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
