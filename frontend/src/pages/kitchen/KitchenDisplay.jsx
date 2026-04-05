import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { socket, connectSocket, disconnectSocket, joinKitchen } from '../../socket';
import { Badge } from '../../components/Badge';

export default function KitchenDisplay() {
  const { session_id } = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    connectSocket();
    joinKitchen(session_id);

    socket.on('new_ticket', () => {
      toast('New Order Received!', { icon: '🔔' });
      queryClient.invalidateQueries(['kitchen-tickets']);
    });

    socket.on('ticket_updated', () => queryClient.invalidateQueries(['kitchen-tickets']));
    socket.on('item_prepared', () => queryClient.invalidateQueries(['kitchen-tickets']));

    return () => {
      socket.off('new_ticket');
      socket.off('ticket_updated');
      socket.off('item_prepared');
      disconnectSocket();
    };
  }, [session_id, queryClient]);

  const { data: tickets } = useQuery({
    queryKey: ['kitchen-tickets', session_id],
    queryFn: async () => {
      const res = await api.get('/kitchen/tickets', { params: { session_id } });
      return res.data.data;
    },
    refetchInterval: 10000 // fallback
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/kitchen/tickets/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries(['kitchen-tickets'])
  });

  const prepareItemMutation = useMutation({
    mutationFn: (id) => api.patch(`/kitchen/items/${id}/prepare`),
    onSuccess: () => queryClient.invalidateQueries(['kitchen-tickets'])
  });

  const toCook = tickets?.filter(t => t.status === 'to_cook') || [];
  const preparing = tickets?.filter(t => t.status === 'preparing') || [];
  const completed = tickets?.filter(t => t.status === 'completed') || [];

  const TicketCard = ({ t }) => (
    <div className="kitchen-ticket animate-scale-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="ticket-num">Order #{t.order_number}</div>
        <Badge variant={t.status}>{t.status.replace('_', ' ').toUpperCase()}</Badge>
      </div>
      <div className="ticket-table">{t.table_number ? `Table ${t.table_number}` : 'Walk-in'}</div>
      
      {t.notes && (
        <div style={{ background: '#FCD34D', color: '#0F172A', padding: '6px 10px', fontSize: '13px', borderRadius: '4px', marginTop: '8px', fontWeight: 'bold' }}>
          📝 {t.notes}
        </div>
      )}

      <div style={{ marginTop: '8px', marginBottom: '16px' }}>
        {t.items?.map(i => {
          // Generate a deterministic mock rating for each item based on its ID or just random on mount
          // To keep it simple, we just generate once visually per render
          const itemRating = (4.0 + (i.id % 10) / 10 + Math.random() * 0.2).toFixed(1);
          return (
            <div 
              key={i.id} 
              className={`ticket-item ${i.is_prepared ? 'prepared' : ''}`}
              onClick={() => prepareItemMutation.mutate(i.id)}
            >
              <div style={{display: 'flex', alignItems: 'center'}}>
                <span style={{flex: 1}}>{i.quantity}x {i.product_name}</span>
                {!i.is_prepared && <span className="ticket-rating-badge">★ {itemRating}</span>}
              </div>
              <span>{i.is_prepared ? '✓' : '◯'}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {t.status === 'to_cook' && <button className="btn btn-sm btn-info btn-block" onClick={() => statusMutation.mutate({ id: t.id, status: 'preparing' })}>Start Cooking</button>}
        {t.status === 'preparing' && <button className="btn btn-sm btn-success btn-block" onClick={() => statusMutation.mutate({ id: t.id, status: 'completed' })}>Mark Done</button>}
      </div>
    </div>
  );

  return (
    <div className="kitchen-layout colorful-kitchen-ui">
      <div className="kitchen-main">
        <div className="kitchen-topbar">
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>KITCHEN DISPLAY SYSTEM</div>
          <div style={{ fontSize: '14px', opacity: 0.5 }}>Session: {session_id.substring(0, 8)}</div>
        </div>
        
        <div className="kitchen-stages">
          <div className="kitchen-stage">
            <div className="kitchen-stage-header"><span>To Cook</span> <Badge>{toCook.length}</Badge></div>
            <div className="kitchen-cards">{toCook.map(t => <TicketCard key={t.id} t={t} />)}</div>
          </div>
          <div className="kitchen-stage">
            <div className="kitchen-stage-header"><span>Preparing</span> <Badge>{preparing.length}</Badge></div>
            <div className="kitchen-cards">{preparing.map(t => <TicketCard key={t.id} t={t} />)}</div>
          </div>
          <div className="kitchen-stage" style={{ opacity: 0.7 }}>
            <div className="kitchen-stage-header"><span>Completed</span> <Badge>{completed.length}</Badge></div>
            <div className="kitchen-cards">{completed.map(t => <TicketCard key={t.id} t={t} />)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
