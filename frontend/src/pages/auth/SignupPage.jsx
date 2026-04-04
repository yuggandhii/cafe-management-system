import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import styles from './Auth.module.css';

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string()
        .min(8, 'At least 8 characters')
        .regex(/[A-Z]/, 'Uppercase letter required')
        .regex(/[0-9]/, 'Number required')
        .regex(/[^A-Za-z0-9]/, 'Special character required'),
    role: z.enum(['admin', 'staff', 'kitchen']),
});

const rules = [
    { label: '8+ Chars', test: (p) => p.length >= 8 },
    { label: 'Uppercase', test: (p) => /[A-Z]/.test(p) },
    { label: 'Number', test: (p) => /[0-9]/.test(p) },
    { label: 'Special', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [pass, setPass] = useState('');
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { role: 'admin' },
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.post('/auth/signup', data);
            toast.success('Account created! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const togglePass = () => setShowPass(p => !p);

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.brand}>
                    <div className={styles.logoRow}>
                        <div className={styles.logoIcon}>C</div>
                        <span className={styles.title}>POS Cafe</span>
                    </div>
                    <p className={styles.sub}>Create your account to get started</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label}>Full Name</label>
                        <input
                            {...register('name')}
                            placeholder="Enter your full name"
                            className={[styles.input, errors.name ? styles.inputError : ''].join(' ')}
                        />
                        {errors.name && <span className={styles.error}>{errors.name.message}</span>}
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="you@example.com"
                            className={[styles.input, errors.email ? styles.inputError : ''].join(' ')}
                        />
                        {errors.email && <span className={styles.error}>{errors.email.message}</span>}
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Role</label>
                        <select {...register('role')} className={styles.input}>
                            <option value="admin">Admin - Owner / Manager</option>
                            <option value="staff">Staff - Waiter / Cashier</option>
                            <option value="kitchen">Kitchen - Cook / Chef</option>
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.passWrap}>
                            <input
                                {...register('password')}
                                type={showPass ? 'text' : 'password'}
                                placeholder="Create a strong password"
                                onChange={(e) => setPass(e.target.value)}
                                className={[styles.input, errors.password ? styles.inputError : ''].join(' ')}
                            />
                            <button type="button" className={styles.eye} onClick={togglePass}>
                                {showPass ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>
                        <div className={styles.rules}>
                            {rules.map((r) => (
                                <span key={r.label} className={[styles.rule, r.test(pass) ? styles.ruleOk : ''].join(' ')}>
                                    {r.test(pass) ? 'OK' : 'NO'} {r.label}
                                </span>
                            ))}
                        </div>
                        {errors.password && <span className={styles.error}>{errors.password.message}</span>}
                    </div>

                    <button type="submit" disabled={loading} className={styles.btn}>
                        {loading ? <span className={styles.spinner} /> : 'Create Account'}
                    </button>
                </form>

                <p className={styles.switch}>
                    Already have an account?{' '}
                    <Link to="/login" className={styles.switchLink}>Sign in here</Link>
                </p>
            </div>
        </div>
    );
}