import { useNavigate, useParams } from 'react-router-dom';
import usePosStore from '../../store/posStore';

export default function Confirmation() {
  const { config_id } = useParams();
  const navigate = useNavigate();
  const { clearCart } = usePosStore();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg)',
      flexDirection: 'column',
      gap: 20,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 72 }}>✅</div>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Payment Successful!</h1>
      <p style={{ color: 'var(--text-3)', fontSize: 16 }}>Order has been completed.</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            clearCart();
            navigate(`/pos/${config_id}`);
          }}
        >
          ← Back to Floor
        </button>
        <button
          className="btn btn-secondary btn-lg"
          onClick={() => navigate('/backend/orders')}
        >
          View Orders
        </button>
      </div>
    </div>
  );
}
