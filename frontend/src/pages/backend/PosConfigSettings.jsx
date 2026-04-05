import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useToast } from '../../components/Toast';
import api from '../../api/axios';

export default function PosConfigSettings() {
  const { id } = useParams();
  const toast = useToast();
  const qc = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['pos-config', id],
    queryFn: () => api.get(`/pos-configs/${id}`).then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (config) reset(config);
  }, [config, reset]);

  const update = useMutation({
    mutationFn: (data) => api.put(`/pos-configs/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['pos-config', id]); toast.success('Settings saved'); },
    onError: () => toast.error('Save failed'),
  });

  if (isLoading) return <AdminLayout title="POS Config"><div className="loading-center"><div className="spinner" /></div></AdminLayout>;

  return (
    <AdminLayout title={`⚙️ ${config?.name} — Settings`}>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header"><span className="card-title">Terminal Settings</span></div>
        <div className="card-body">
          <form onSubmit={handleSubmit((d) => update.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Terminal Name</label>
              <input className="form-input" {...register('name')} />
            </div>

            <div>
              <div className="form-label" style={{ marginBottom: 10 }}>Payment Methods</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key: 'enable_cash', label: 'Cash' },
                  { key: 'enable_digital', label: 'Card / Digital' },
                  { key: 'enable_upi', label: 'UPI' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" {...register(key)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input className="form-input" {...register('upi_id')} placeholder="yourname@upi" />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
