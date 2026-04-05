import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';

export default function PosConfirmation() {
  const { config_id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="pos-layout flex-center bg">
      <div className="card confirm-screen" style={{ width: '100%', maxWidth: 480 }}>
        <div className="confirm-icon">✅</div>
        <h1>Payment Successful!</h1>
        <p className="text-secondary mb-6">The order has been fully processed.</p>
        
        <div className="flex gap-3" style={{ flexDirection: 'column' }}>
          <Button size="lg" block onClick={() => navigate(`/pos/${config_id}`)}>
            New Order (Floor)
          </Button>
          <Button size="lg" block variant="outline" onClick={() => navigate(`/backend`)}>
            Back to Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
