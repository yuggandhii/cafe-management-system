import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { usePosStore } from '../../store/posStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { DataTable } from '../../components/DataTable';
import { Badge } from '../../components/Badge';
import { format } from 'date-fns';

export default function PosConfigPage() {
  const [newConfigName, setNewConfigName] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setSession, setPosConfig } = usePosStore();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['pos-configs'],
    queryFn: async () => {
      const res = await api.get('/pos-configs');
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (name) => api.post('/pos-configs', { name }),
    onSuccess: () => {
      toast.success('POS Block created');
      setNewConfigName('');
      queryClient.invalidateQueries(['pos-configs']);
    }
  });

  const openSessionMutation = useMutation({
    mutationFn: (configId) => api.post('/sessions/open', { pos_config_id: configId, opening_cash: 0 }),
    onSuccess: async (res) => {
      // Get full config to save in store
      const configRes = await api.get(`/pos-configs/${res.data.data.pos_config_id}`);
      setPosConfig(configRes.data.data);
      setSession(res.data.data);
      navigate(`/pos/${configRes.data.data.id}`);
    }
  });

  const getActiveSession = async (configId) => {
    try {
      const res = await api.get(`/sessions/active/${configId}`);
      return res.data.data; // will be null if no active session
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

  const handleCloseSession = async (configId) => {
    try {
      const active = await getActiveSession(configId);
      if (active) {
        await api.post(`/sessions/${active.id}/close`, { closing_cash: 0 });
        toast.success('Session closed');
        queryClient.invalidateQueries(['pos-configs']);
      }
    } catch (e) {
      toast.error('Failed to close session');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { 
      header: 'Cash', 
      cell: (r) => r.enable_cash ? <Badge variant="success">Yes</Badge> : <Badge variant="draft">No</Badge> 
    },
    { 
      header: 'Digital', 
      cell: (r) => r.enable_digital ? <Badge variant="success">Yes</Badge> : <Badge variant="draft">No</Badge> 
    },
    { 
      header: 'UPI', 
      cell: (r) => r.enable_upi ? <Badge variant="success">Yes</Badge> : <Badge variant="draft">No</Badge> 
    },
    { 
      header: 'Created At', 
      cell: (r) => format(new Date(r.created_at), 'dd MMM yyyy, HH:mm') 
    },
    {
      header: 'Actions',
      cell: (r) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleOpenPos(r)}>
            Open Session / Resume
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open('/customer-display', '_blank')}>
            Open Kiosk Mode
          </Button>
          {user?.role === 'admin' && (
            <Button size="sm" variant="danger" onClick={() => handleCloseSession(r.id)}>
              Force Close Session
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header flex-between mb-6">
        <div>
          <h1>Point of Sale Terminals</h1>
          <p>Manage POS Configurations and Sessions</p>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="card mb-6 flex gap-3 align-center" style={{ maxWidth: 400 }}>
          <Input 
            placeholder="New POS Name..." 
            value={newConfigName} 
            onChange={(e) => setNewConfigName(e.target.value)} 
          />
          <Button 
            disabled={!newConfigName || createMutation.isPending}
            onClick={() => createMutation.mutate(newConfigName)}
          >
            Create
          </Button>
        </div>
      )}

      <div className="card">
        <DataTable 
          columns={columns} 
          data={configs} 
          isLoading={isLoading} 
          emptyMessage="No POS blocks found. Create one."
        />
      </div>
    </div>
  );
}
