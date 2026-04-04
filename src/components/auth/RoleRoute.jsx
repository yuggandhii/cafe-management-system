import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function RoleRoute({ children, roles }) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
