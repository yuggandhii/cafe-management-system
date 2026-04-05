import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/Toast';
import useAuthStore from './store/authStore';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Backend pages
import PosConfigList from './pages/backend/PosConfigList';
import PosConfigSettings from './pages/backend/PosConfigSettings';
import ProductsList from './pages/backend/ProductsList';
import ProductForm from './pages/backend/ProductForm';
import CategoriesList from './pages/backend/CategoriesList';
import OrdersList from './pages/backend/OrdersList';
import OrderDetail from './pages/backend/OrderDetail';
import PaymentsList from './pages/backend/PaymentsList';
import CustomersList from './pages/backend/CustomersList';
import Reports from './pages/backend/Reports';
import FloorsManagement from './pages/backend/FloorsManagement';

// POS pages
import FloorView from './pages/pos/FloorView';
import OrderScreen from './pages/pos/OrderScreen';
import PaymentScreen from './pages/pos/PaymentScreen';
import Confirmation from './pages/pos/Confirmation';

// Special pages
import KitchenDisplay from './pages/kitchen/KitchenDisplay';
import SelfOrder from './pages/customer/SelfOrder';
import CustomerDisplay from './pages/customer/CustomerDisplay';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

// Protected route wrapper
const RequireAuth = () => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Public special routes */}
            <Route path="/kitchen/:session_id" element={<KitchenDisplay />} />
            <Route path="/customer-display" element={<CustomerDisplay />} />
            <Route path="/customer-display/:order_id" element={<CustomerDisplay />} />
            <Route path="/s/:token" element={<SelfOrder />} />

            {/* Protected routes */}
            <Route element={<RequireAuth />}>
              {/* Backend admin */}
              <Route path="/backend" element={<PosConfigList />} />
              <Route path="/backend/pos-config/:id" element={<PosConfigSettings />} />
              <Route path="/backend/products" element={<ProductsList />} />
              <Route path="/backend/products/:id" element={<ProductForm />} />
              <Route path="/backend/categories" element={<CategoriesList />} />
              <Route path="/backend/orders" element={<OrdersList />} />
              <Route path="/backend/orders/:id" element={<OrderDetail />} />
              <Route path="/backend/payments" element={<PaymentsList />} />
              <Route path="/backend/customers" element={<CustomersList />} />
              <Route path="/backend/reports" element={<Reports />} />
              <Route path="/backend/floors" element={<FloorsManagement />} />

              {/* POS Terminal */}
              <Route path="/pos/:config_id" element={<FloorView />} />
              <Route path="/pos/:config_id/order/:table_id" element={<OrderScreen />} />
              <Route path="/pos/:config_id/payment/:order_id" element={<PaymentScreen />} />
              <Route path="/pos/:config_id/confirmation" element={<Confirmation />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
