import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';

export default function KitchenLandingPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions/active-all/list')
      .then(res => setSessions(res.data.data || []))
      .catch(e => console.error(e))
      .finally(() => setIsLoading(false));
  }, []);

  const handleJoin = (sessionId) => {
    if (sessionId) {
      navigate(`/kitchen/${sessionId}`);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-dark)' }}>
          <Badge variant="warning" style={{ marginBottom: '12px' }}>KITCHEN</Badge>
          <h1 style={{ textTransform: 'uppercase', marginBottom: '8px' }}>Odoo Cafe</h1>
          <p className="text-secondary" style={{ fontSize: '13px' }}>Kitchen Display Portal</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isLoading ? (
            <div className="spinner mx-auto" />
          ) : sessions.length > 0 ? (
            sessions.map(s => (
              <Button 
                key={s.id} 
                variant="primary" 
                size="lg" 
                block 
                onClick={() => handleJoin(s.id)}
              >
                Join Kitchen: {s.config_name}
              </Button>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
              <p>No active POS sessions right now.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Staff must open a POS session first!</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
          <p className="text-secondary" style={{ fontSize: '12px', marginBottom: '12px' }}>Logged in as {user?.email}</p>
          <Button variant="outline" size="sm" onClick={handleLogout} block>Logout</Button>
        </div>
      </div>
    </div>
  );
}
