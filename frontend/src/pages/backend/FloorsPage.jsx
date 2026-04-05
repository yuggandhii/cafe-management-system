import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';

export default function FloorsPage() {
  const queryClient = useQueryClient();
  const [selectedConfig, setSelectedConfig] = useState('');
  
  // New Floor State
  const [newFloorName, setNewFloorName] = useState('');
  
  // New Table State
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableSeats, setNewTableSeats] = useState(4);

  const { data: configs } = useQuery({
    queryKey: ['pos-configs'],
    queryFn: async () => {
      const res = await api.get('/pos-configs');
      return res.data.data;
    }
  });

  const { data: floors, isLoading: floorsLoading } = useQuery({
    queryKey: ['floors', selectedConfig],
    queryFn: async () => {
      const res = await api.get('/floors', { params: { pos_config_id: selectedConfig } });
      return res.data.data;
    },
    enabled: !!selectedConfig
  });

  const [selectedFloor, setSelectedFloor] = useState(null);

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables', selectedFloor],
    queryFn: async () => {
      const res = await api.get('/floors/tables', { params: { floor_id: selectedFloor } });
      return res.data.data;
    },
    enabled: !!selectedFloor
  });

  const createFloorMutation = useMutation({
    mutationFn: (data) => api.post('/floors', data),
    onSuccess: () => {
      toast.success('Floor created');
      setNewFloorName('');
      queryClient.invalidateQueries(['floors', selectedConfig]);
    }
  });

  const createTableMutation = useMutation({
    mutationFn: (data) => api.post('/floors/tables', data),
    onSuccess: () => {
      toast.success('Table created');
      setNewTableNum('');
      queryClient.invalidateQueries(['tables', selectedFloor]);
    }
  });

  const [qrData, setQrData] = useState(null);

  return (
    <div className="page-content">
      <div className="page-header mb-6">
        <h1>Floors & Tables</h1>
        <p>Configure restaurant layout and generate Table QR codes.</p>
      </div>

      <div className="card mb-6 animate-slide-up">
        <div style={{ maxWidth: 300 }}>
          <Select 
            label="Select POS Context" 
            value={selectedConfig} 
            onChange={(e) => { setSelectedConfig(e.target.value); setSelectedFloor(null); }}
            options={configs?.map(c => ({ value: c.id, label: c.name })) || []}
          />
        </div>
      </div>

      {selectedConfig && (
        <div className="form-grid">
          {/* Floors */}
          <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3>Floors</h3>
            <div className="flex gap-2 mt-4 mb-4">
              <Input placeholder="Floor Name..." value={newFloorName} onChange={e => setNewFloorName(e.target.value)} />
              <Button onClick={() => createFloorMutation.mutate({ name: newFloorName, pos_config_id: selectedConfig })} disabled={!newFloorName}>Add</Button>
            </div>
            <DataTable 
              columns={[{ header: 'Floor Name', accessor: 'name' }]} 
              data={floors} 
              isLoading={floorsLoading}
              onRowClick={(row) => setSelectedFloor(row.id)}
            />
          </div>

          {/* Tables */}
          {selectedFloor && (
            <div className="card animate-scale-in">
              <h3>Tables for Selected Floor</h3>
              <div className="flex gap-2 mt-4 mb-4 align-end">
                <Input label="Table No." value={newTableNum} onChange={e => setNewTableNum(e.target.value)} />
                <Input label="Seats" type="number" min="1" value={newTableSeats} onChange={e => setNewTableSeats(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 80 }} />
                <Button onClick={() => createTableMutation.mutate({ floor_id: selectedFloor, table_number: newTableNum, seats: newTableSeats })} disabled={!newTableNum}>Add</Button>
              </div>
              <DataTable 
                columns={[
                  { header: 'Table No.', accessor: 'table_number' },
                  { header: 'Seats', accessor: 'seats' },
                  { 
                    header: 'Order QR', 
                    cell: (r) => (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setQrData(r); }}>
                        Generate QR
                      </Button>
                    ) 
                  }
                ]} 
                data={tables} 
                isLoading={tablesLoading}
              />
            </div>
          )}
        </div>
      )}

      {/* QR Code Modal */}
      {qrData && (
        <Modal isOpen={!!qrData} title={`QR Code - Table ${qrData.table_number}`} onClose={() => setQrData(null)}>
          <div style={{ textAlign: 'center' }}>
            <p className="mb-4">Scan this to order directly from Table {qrData.table_number}</p>
            <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${window.location.origin}/table/${qrData.id}`} 
               alt="Table QR"
               style={{ margin: '0 auto', border: '10px solid white', borderRadius: 8 }}
            />
            <div className="mt-6 flex justify-center gap-4">
              <Button onClick={() => window.open(window.location.origin + '/table/' + qrData.id, '_blank')}>Open Self-Order Link</Button>
              <Button variant="outline" onClick={() => setQrData(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
