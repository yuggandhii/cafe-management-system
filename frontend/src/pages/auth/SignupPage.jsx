import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  role: z.enum(['admin', 'staff', 'kitchen']).default('staff'),
});

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'staff' },
    mode: 'onBlur',
  });

  const password = watch('password', '');

  const hints = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const setAuth = useAuthStore((s) => s.setAuth);
  
  const signupMutation = useMutation({
    mutationFn: (data) => api.post('/auth/signup', data),
    onSuccess: (res) => {
      if (res.data.data.accessToken) {
         setAuth({ accessToken: res.data.data.accessToken, user: res.data.data.user });
         toast.success('Account created and logged in!');
         navigate('/backend');
      } else {
         toast.success('Account created successfully');
         navigate('/login');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });

  const onSubmit = (data) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Official_Odoo_logo.svg" alt="Odoo Logo" style={{ height: '40px' }} />
        </div>
        <h1>Create Account</h1>
        <p className="text-secondary">Join Odoo Cafe</p>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input 
            label="Full Name" 
            placeholder="Name"
            {...register('name')}
            error={errors.name?.message}
          />
          
          <Input 
            label="Email" 
            placeholder="john@example.com"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input 
            label="Phone Number" 
            placeholder="+1 555-0199"
            {...register('phone')}
            error={errors.phone?.message}
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
            
            <div className="pw-hints">
              <div className={`pw-hint ${hints.length ? 'ok' : ''}`}>
                {hints.length ? '✓' : '✗'} 8+ characters
              </div>
              <div className={`pw-hint ${hints.upper && hints.lower ? 'ok' : ''}`}>
                {hints.upper && hints.lower ? '✓' : '✗'} Upper & lowercase
              </div>
              <div className={`pw-hint ${hints.number ? 'ok' : ''}`}>
                {hints.number ? '✓' : '✗'} Minimum 1 number
              </div>
              <div className={`pw-hint ${hints.special ? 'ok' : ''}`}>
                {hints.special ? '✓' : '✗'} Minimum 1 special character
              </div>
            </div>
          </div>

          <Select
            label="Role"
            {...register('role')}
            error={errors.role?.message}
            options={[
              { value: 'staff', label: 'Staff (POS Access)' },
              { value: 'kitchen', label: 'Kitchen Display Only' },
              { value: 'admin', label: 'Administrator' },
            ]}
          />

          <Button 
            type="submit" 
            variant="primary" 
            block 
            loading={signupMutation.isPending}
            className="mt-4"
          >
            Sign up
          </Button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
