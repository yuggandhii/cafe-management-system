import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { usePosStore } from '../../store/posStore';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';

export default function StaffLandingPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { setSession, setPosConfig } = usePosStore();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['pos-configs'],
    queryFn: async () => {
      const res = await api.get('/pos-configs');
      return res.data.data;
    }
  });

  const openSessionMutation = useMutation({
    mutationFn: (configId) => api.post('/sessions/open', { pos_config_id: configId, opening_cash: 0 }),
    onSuccess: async (res) => {
      const configRes = await api.get(`/pos-configs/${res.data.data.pos_config_id}`);
      setPosConfig(configRes.data.data);
      setSession(res.data.data);
      navigate(`/pos/${configRes.data.data.id}`);
    }
  });

  const getActiveSession = async (configId) => {
    try {
      const res = await api.get(`/sessions/active/${configId}`);
      return res.data.data;
    } catch (e) {
      return null;
    }
  };

  const handleOpenPos = async (config) => {
    try {
      const active = await getActiveSession(config.id);
      if (active) {
        setPosConfig(config);
        setSession(active);
        navigate(`/pos/${config.id}`);
      } else {
        openSessionMutation.mutate(config.id);
      }
    } catch (e) {
      toast.error('Failed to open POS');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    clearAuth();
    navigate('/login');
  };

  if (isLoading) return <div className="p-8 text-center">Loading Terminals...</div>;

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: '60px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '900px', padding: '30px', margin: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid var(--border-dark)' }}>
          <div>
            <h1 style={{ textTransform: 'uppercase', marginBottom: '4px' }}>Odoo Cafe - Staff Portal</h1>
            <p className="text-secondary" style={{ fontSize: '13px' }}>Select a POS Terminal to begin your shift</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: '600', display: 'block', fontSize: '14px' }}>{user?.name}</span>
              <Badge variant="info">STAFF</Badge>
            </div>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {configs?.map(config => (
            <div key={config.id} className="card" style={{ padding: '20px', border: '2px solid var(--border-dark)' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>{config.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px' }}>Cash: {config.enable_cash ? '✅' : '❌'}</span>
                <span style={{ fontSize: '13px' }}>Digital: {config.enable_digital ? '✅' : '❌'}</span>
                <span style={{ fontSize: '13px' }}>UPI: {config.enable_upi ? '✅' : '❌'}</span>
              </div>
              <Button block variant="primary" onClick={() => handleOpenPos(config)}>
                Open Session
              </Button>
            </div>
          ))}
          {(!configs || configs.length === 0) && (
            <p className="text-secondary" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0' }}>No terminals available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
