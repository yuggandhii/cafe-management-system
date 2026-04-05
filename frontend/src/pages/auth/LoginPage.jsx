import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const loginMutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: (res) => {
      const u = res.data.data.user;
      setAuth({ accessToken: res.data.data.accessToken, user: u });
      toast.success('Login successful');
      if (u.role === 'admin') navigate('/backend');
      else if (u.role === 'staff') navigate('/staff');
      else if (u.role === 'kitchen') navigate('/kitchen-landing');
      else navigate('/backend');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  const handleDemoLogin = (role) => {
    const credentials = {
      admin: { email: 'admin@cawfeetawk.com', password: 'Admin@1234' },
      staff: { email: 'staff@cawfeetawk.com', password: 'Staff@1234' },
      kitchen: { email: 'kitchen@cawfeetawk.com', password: 'Kitchen@1234' },
    };
    loginMutation.mutate(credentials[role]);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Official_Odoo_logo.svg" alt="Odoo Logo" style={{ height: '40px' }} />
        </div>
        <h1>Odoo Cafe</h1>
        <p className="text-secondary">Please login to continue</p>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input 
            label="Email" 
            placeholder="admin@cawfeetawk.com"
            {...register('email')}
            error={errors.email?.message}
          />
          
          <div style={{ position: 'relative' }}>
            <Input 
              label="Password" 
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            <button 
              type="button" 
              className="btn btn-ghost btn-sm"
              style={{ position: 'absolute', right: '4px', top: '24px' }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            block 
            loading={loginMutation.isPending}
            className="mt-4"
          >
            Log in
          </Button>
        </form>

        <div className="mt-6 border-t pt-4">
          <p className="text-secondary mb-3 text-center" style={{ fontSize: '13px' }}><strong>Demo Showcase Roles</strong></p>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              type="button" 
              variant="outline" 
              block 
              loading={loginMutation.isPending}
              onClick={() => handleDemoLogin('admin')}
              size="sm"
            >
              🚀 Demo Admin (Dashboard & Config)
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              block 
              loading={loginMutation.isPending}
              onClick={() => handleDemoLogin('staff')}
              size="sm"
            >
              ☕ Demo Staff (POS Terminal)
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              block 
              loading={loginMutation.isPending}
              onClick={() => handleDemoLogin('kitchen')}
              size="sm"
            >
              🍳 Demo Kitchen Staff
            </Button>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <p className="text-secondary mb-3 text-center" style={{ fontSize: '13px' }}><strong>Public Display Links</strong></p>
          <div className="grid grid-cols-1 gap-2">
            <Link to="/customer-display" className="btn btn-outline btn-sm btn-block no-underline flex items-center justify-center">
              📺 Customer Display
            </Link>
          </div>
        </div>

        <div className="auth-link mt-4">
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </div>
      </div>
    </div>
  );
}
