import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import { usePosStore } from '../../store/posStore';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

export default function PosFloorView() {
  const { config_id } = useParams();
  const navigate = useNavigate();
  const { activeSession, setOrder, setTable } = usePosStore();
  const [activeFloor, setActiveFloor] = useState(null);
  const [walkInModal, setWalkInModal] = useState(false);

  const { data: floors } = useQuery({
    queryKey: ['floors', config_id],
    queryFn: async () => {
      const res = await api.get('/floors', { params: { pos_config_id: config_id } });
      if (res.data.data.length > 0 && !activeFloor) setActiveFloor(res.data.data[0].id);
      return res.data.data;
    }
  });

  const { data: tables } = useQuery({
    queryKey: ['tables', activeFloor],
    queryFn: async () => {
      const res = await api.get('/floors/tables', { params: { floor_id: activeFloor } });
      return res.data.data;
    },
    enabled: !!activeFloor
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['active-orders', activeSession?.id],
    queryFn: async () => {
      const res = await api.get('/orders', { params: { session_id: activeSession.id, status: 'draft' } });
      return res.data.data;
    },
    enabled: !!activeSession,
    refetchInterval: 5000
  });

  const createOrderMutation = useMutation({
    mutationFn: (table_id) => api.post('/orders', { session_id: activeSession.id, table_id }),
    onSuccess: (res) => {
      setOrder(res.data.data);
      navigate(`/pos/${config_id}/order/${res.data.data.table_id || 'walk-in'}`);
    }
  });

  const handleTableClick = (table) => {
    setTable(table);
    // Check if table has active order
    const existing = activeOrders?.find(o => o.table_id === table.id);
    if (existing) {
      setOrder(existing);
      navigate(`/pos/${config_id}/order/${table.id}`);
    } else {
      createOrderMutation.mutate(table.id);
    }
  };

  const handleWalkIn = () => {
    setTable(null);
    createOrderMutation.mutate(null); // null table_id
  };

  return (
    <div className="pos-layout" style={{ flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Topbar */}
      <div className="pos-topbar">
        <div className="font-semibold">Cawfee Tawk Floor</div>
        <div className="pos-topbar-tabs">
          {floors?.map(f => (
            <button key={f.id} className={`pos-topbar-tab ${activeFloor === f.id ? 'active' : ''}`} onClick={() => setActiveFloor(f.id)}>
              {f.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="accent" onClick={() => setWalkInModal(true)}>Walk-In Order</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('/backend')}>Exit POS</Button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="floor-grid">
          {tables?.map(t => {
            const isOccupied = activeOrders?.some(o => o.table_id === t.id);
            return (
              <div key={t.id} className={`table-card ${isOccupied ? 'occupied' : ''}`} onClick={() => handleTableClick(t)}>
                <div className="table-num">{t.table_number}</div>
                <div className="table-seats">{t.seats} Seats</div>
                <div className="table-status">{isOccupied ? 'Occupied' : 'Available'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal 
        isOpen={walkInModal} 
        onClose={() => setWalkInModal(false)}
        title="Walk-In Customer"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setWalkInModal(false)}>Cancel</Button>
            <Button onClick={handleWalkIn} loading={createOrderMutation.isPending}>Start Order</Button>
          </>
        )}
      >
        <p>Start a new order without assigning it to a table?</p>
      </Modal>
    </div>
  );
}
