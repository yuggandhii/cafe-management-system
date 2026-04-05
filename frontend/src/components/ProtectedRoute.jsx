import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { connectSocket, disconnectSocket } from '../socket';

export function ProtectedRoute({ children }) {
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    }
    return () => {
      // Note: We don't necessarily want to disconnect on every unmount 
      // if the user is just navigating between admin pages.
      // But we should ensure it's connected.
    };
  }, [accessToken]);

  if (!accessToken) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <h2>Access Denied</h2>
      <p>Admin access required for this page.</p>
    </div>
  );
  return children;
}
