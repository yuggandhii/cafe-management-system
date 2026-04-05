import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const isEdit = !!id;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const res = await api.get('/products/categories'); return res.data.data; }
  });

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => { const res = await api.get(`/products/${id}`); return res.data.data; },
    enabled: isEdit
  });

  const { register, control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      name: '', description: '', image_url: '', price: '0.00', category_id: '',
      unit_of_measure: 'Unit', tax_percent: '0.00', send_to_kitchen: true,
      variants: []
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });
  const watchedImageUrl = watch('image_url');

  useEffect(() => {
    if (product) {
      reset({ ...product, image_url: product.image_url || '' });
    }
  }, [product, reset]);

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/products/${id}`, data) : api.post('/products', data),
    onSuccess: () => {
      toast.success(`Product ${isEdit ? 'updated' : 'created'}`);
      queryClient.invalidateQueries(['products']);
      navigate('/backend/products');
    }
  });

  const onSubmit = (data) => {
    const payload = { ...data };
    // image_url is stored as its own DB column - send directly
    // do NOT embed in description
    saveMutation.mutate(payload);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        reset({ ...control._formValues, image_url: res.data.url });
        toast.success('Image successfully securely uploaded!');
      }
    } catch (err) {
      toast.error('Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header mb-6">
        <h1>{isEdit ? 'Edit Product' : 'New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card mb-6">
          <h3>Basic Info</h3>
          <div className="form-grid mt-4">
            <Input label="Name" {...register('name', { required: true })} />
            <Select label="Category" {...register('category_id', { required: true })}
              options={categories?.map(c => ({ value: c.id, label: c.name })) || []} />
            <Input label="Description" className="form-full" {...register('description')} />
            
            <div className="form-full flex gap-4 align-end" style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, border: '1px dashed var(--border-dark)' }}>
               <div style={{ flex: 1 }}>
                 <Input label="Image URL (Drive Link/Web URL)" placeholder="https://..." {...register('image_url')} />
               </div>
               <div style={{ paddingBottom: '0px' }}>
                 <p className="text-sm text-center mb-2" style={{ fontWeight: 600 }}>OR</p>
                 <label className="pos2-action-btn" style={{ margin: 0, padding: '8px 16px', display: 'inline-block', borderRadius: 4, cursor: 'pointer', background: 'var(--color-primary)' }}>
                   {uploadingImage ? 'Uploading...' : 'Upload from Device'}
                   <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploadingImage} />
                 </label>
               </div>
            </div>

            {/* Live Image Preview */}
            {watchedImageUrl && (
              <div className="form-full" style={{ marginTop: 4 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Preview</p>
                <div style={{ border: '2px solid var(--border-dark)', width: '100%', height: 200, overflow: 'hidden', background: '#f5f5f5', position: 'relative' }}>
                  <img
                    src={watchedImageUrl}
                    alt="Product preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div style={{ display: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                    ⚠️ Could not load image — check the URL
                  </div>
                </div>
              </div>
            )}
            <Input label="Price" type="number" step="0.01" {...register('price', { required: true })} />
            <Input label="Tax %" type="number" step="0.01" {...register('tax_percent')} />
            <div className="input-group">
              <label>Send to Kitchen</label>
              <Select {...register('send_to_kitchen')} options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]} />
            </div>
            <Input label="UOM" {...register('unit_of_measure')} />
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex-between mb-4">
            <h3>Variants (Optional)</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => append({ attribute_name: 'Size', value: '', extra_price: 0 })}>Add Variant</Button>
          </div>
          {fields.map((f, i) => (
            <div key={f.id} className="flex gap-2 align-end mb-2">
              <Input label="Attribute (e.g. Size)" {...register(`variants.${i}.attribute_name`)} />
              <Input label="Value (e.g. Large)" {...register(`variants.${i}.value`)} />
              <Input label="Extra Price" type="number" step="0.01" {...register(`variants.${i}.extra_price`)} />
              <Button type="button" variant="danger" onClick={() => remove(i)}>X</Button>
            </div>
          ))}
          {fields.length === 0 && <p className="text-muted text-sm">No variants added.</p>}
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={saveMutation.isPending}>Save Product</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/backend/products')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
