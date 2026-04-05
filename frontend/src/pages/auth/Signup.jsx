import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/Toast';

const schema = z.object({
  name:     z.string().min(2, 'Name required'),
  email:    z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
  role:     z.enum(['admin', 'staff', 'kitchen']).default('staff'),
});

/* ── Minimal Aesthetic Café Palette ── */
const C = {
  bg:        '#FAFAFA',
  secondary: '#EDE0D4',
  primary:   '#A3B18A',
  accent:    '#588157',
  text:      '#344E41',
  muted:     '#6b8c78',
  surface:   '#ffffff',
  error:     '#c1121f',
};

export default function Signup() {
  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();
  const toast       = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'staff' },
  });

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/signup', data);
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      toast.success('Account created!');
      navigate('/backend');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: 'none', borderRadius: 0,
    fontSize: 13, fontFamily: 'inherit',
    background: 'transparent', color: C.text,
    outline: 'none', transition: 'all 0.18s ease',
  };

  const FieldLabel = ({ dot, children }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 700, color: C.text,
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
    }}>
      <span style={{ display: 'inline-block', width: 7, height: 7, background: dot, flexShrink: 0 }} />
      {children}
    </div>
  );

  const ErrorMsg = ({ msg }) => (
    <div style={{
      color: C.error, fontSize: 11.5, marginTop: 5,
      borderLeft: `2px solid ${C.error}`, paddingLeft: 8,
    }}>
      {msg}
    </div>
  );

  const InputRow = ({ icon, iconColor, children, onFocusParent, onBlurParent }) => (
    <div style={{
      display: 'flex', alignItems: 'center',
      border: `1.5px solid ${C.secondary}`,
      background: C.bg, transition: 'border-color 0.18s ease',
    }}
      onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = C.secondary; }}
    >
      <span style={{
        padding: '10px 12px', color: iconColor, fontSize: 14,
        borderRight: `1px solid ${C.secondary}`, flexShrink: 0,
        background: `${C.secondary}33`,
      }}>{icon}</span>
      {children}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, position: 'relative', overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 18% 55%, rgba(163,177,138,0.18) 0%, transparent 55%),
          radial-gradient(ellipse at 82% 18%, rgba(237,224,212,0.40) 0%, transparent 50%),
          radial-gradient(ellipse at 60% 85%, rgba(88,129,87,0.08) 0%, transparent 40%)
        `,
      }} />

      {/* Top-left brand mark */}
      <div style={{
        position: 'fixed', top: 0, left: 0,
        padding: '18px 28px', display: 'flex',
        alignItems: 'center', gap: 10, zIndex: 50,
      }}>
        <span style={{ fontSize: 24, filter: 'drop-shadow(0 2px 6px rgba(88,129,87,0.30))' }}>☕</span>
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.text, letterSpacing: '-0.3px' }}>
            POS Cafe
          </div>
          <div style={{
            fontSize: 9, fontWeight: 700, color: C.accent,
            letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2,
          }}>
            Restaurant Point of Sale
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420,
        margin: '80px 16px 24px',
        background: C.surface,
        border: `1px solid ${C.secondary}`,
        boxShadow: `0 4px 28px rgba(52,78,65,0.10), 0 1px 6px rgba(163,177,138,0.12)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', overflow: 'hidden',
      }}>
        {/* Top accent stripe */}
        <div style={{
          height: 4, width: '100%', flexShrink: 0,
          background: `linear-gradient(90deg, ${C.accent} 0%, ${C.primary} 100%)`,
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', padding: '30px 44px 20px', width: '100%' }}>
          <span style={{
            display: 'block', fontSize: 36, marginBottom: 12,
            filter: 'drop-shadow(0 4px 10px rgba(88,129,87,0.20))',
          }}>☕</span>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            Create Account.
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
            Set up your POS Cafe access
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.secondary, width: '100%' }} />

        {/* Form body */}
        <div style={{ width: '100%', padding: '24px 44px 0' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Full Name */}
            <div>
              <FieldLabel dot={C.accent}>Full Name</FieldLabel>
              <InputRow icon="👤" iconColor={C.accent}>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  style={inputStyle}
                  {...register('name')}
                />
              </InputRow>
              {errors.name && <ErrorMsg msg={errors.name.message} />}
            </div>

            {/* Email */}
            <div>
              <FieldLabel dot={C.primary}>Email Address</FieldLabel>
              <InputRow icon="✉" iconColor={C.primary}>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="john@cafe.com"
                  style={inputStyle}
                  {...register('email')}
                />
              </InputRow>
              {errors.email && <ErrorMsg msg={errors.email.message} />}
            </div>

            {/* Password */}
            <div>
              <FieldLabel dot={C.accent}>Password</FieldLabel>
              <InputRow icon="🔑" iconColor={C.accent}>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  style={inputStyle}
                  {...register('password')}
                />
              </InputRow>
              {errors.password && <ErrorMsg msg={errors.password.message} />}
            </div>

            {/* Role */}
            <div>
              <FieldLabel dot={C.primary}>Role</FieldLabel>
              <select
                id="signup-role"
                style={{
                  width: '100%', padding: '10px 14px',
                  border: `1.5px solid ${C.secondary}`, borderRadius: 0,
                  fontSize: 13, fontFamily: 'inherit',
                  background: C.bg, color: C.text,
                  outline: 'none', cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23588157' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                  transition: 'border-color 0.18s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = C.accent}
                onBlur={(e)  => e.target.style.borderColor = C.secondary}
                {...register('role')}
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="kitchen">Kitchen</option>
              </select>
            </div>

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '13px 20px',
                background: isSubmitting
                  ? C.primary
                  : `linear-gradient(90deg, ${C.accent} 0%, ${C.primary} 100%)`,
                border: 'none', borderRadius: 0, color: '#fff',
                fontSize: 13.5, fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: 'inherit', letterSpacing: '0.06em', textTransform: 'uppercase',
                boxShadow: `0 4px 18px rgba(88,129,87,0.28)`,
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = `linear-gradient(90deg, ${C.text} 0%, ${C.accent} 100%)`;
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = `linear-gradient(90deg, ${C.accent} 0%, ${C.primary} 100%)`;
              }}
            >
              {isSubmitting ? 'Creating Account…' : 'Create Account  →'}
            </button>
          </form>

          {/* Sign in link */}
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: C.muted }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: C.accent, fontWeight: 700 }}>
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 22, padding: '16px 44px 26px',
          borderTop: `1px solid ${C.secondary}`,
          textAlign: 'center', width: '100%',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${C.primary}18`,
            border: `1px solid ${C.secondary}`,
            padding: '6px 14px', fontSize: 12,
          }}>
            <span style={{ color: C.muted }}>Roles:</span>
            <strong style={{ color: C.accent }}>Admin</strong>
            <span style={{ color: C.primary }}>·</span>
            <strong style={{ color: C.text }}>Staff</strong>
            <span style={{ color: C.primary }}>·</span>
            <strong style={{ color: C.accent }}>Kitchen</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
