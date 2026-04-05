import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Auth
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Backend Admin
import BackendLayout from './pages/backend/BackendLayout';
import PosConfigPage from './pages/backend/PosConfigPage';
import ProductsPage from './pages/backend/ProductsPage';
import ProductFormPage from './pages/backend/ProductFormPage';
import CategoriesPage from './pages/backend/CategoriesPage';
import OrdersPage from './pages/backend/OrdersPage';
import OrderDetailPage from './pages/backend/OrderDetailPage';
import PaymentsPage from './pages/backend/PaymentsPage';
import CustomersPage from './pages/backend/CustomersPage';
import ReportsPage from './pages/backend/ReportsPage';
import FloorsPage from './pages/backend/FloorsPage';

// POS Terminal
import PosFloorView from './pages/pos/PosFloorView';
import PosOrderScreen from './pages/pos/PosOrderScreen';
import PosPaymentScreen from './pages/pos/PosPaymentScreen';
import PosConfirmation from './pages/pos/PosConfirmation';

// Special screens
import KitchenDisplay from './pages/kitchen/KitchenDisplay';
import KitchenLandingPage from './pages/kitchen/KitchenLandingPage';
import CustomerDisplay from './pages/customer/CustomerDisplay';
import TableOrderScreen from './pages/customer/TableOrderScreen';
import StaffLandingPage from './pages/staff/StaffLandingPage';

// Guards
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '0px', fontSize: '13px' },
          duration: 3000,
        }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<Navigate to="/backend" replace />} />

          {/* Kitchen & Customer - no auth needed */}
          <Route path="/kitchen/:session_id" element={<KitchenDisplay />} />
          <Route path="/customer-display" element={<CustomerDisplay />} />
          <Route path="/table/:table_id" element={<TableOrderScreen />} />

          {/* Staff & Kitchen Auth Landing */}
          <Route path="/staff" element={<ProtectedRoute><StaffLandingPage /></ProtectedRoute>} />
          <Route path="/kitchen-landing" element={<ProtectedRoute><KitchenLandingPage /></ProtectedRoute>} />

          {/* Backend Admin */}
          <Route path="/backend" element={<AdminRoute><BackendLayout /></AdminRoute>}>
            <Route index element={<PosConfigPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<AdminRoute><ProductFormPage /></AdminRoute>} />
            <Route path="products/:id/edit" element={<AdminRoute><ProductFormPage /></AdminRoute>} />
            <Route path="categories" element={<AdminRoute><CategoriesPage /></AdminRoute>} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
            <Route path="floors" element={<AdminRoute><FloorsPage /></AdminRoute>} />
          </Route>

          {/* POS Terminal */}
          <Route path="/pos/:config_id" element={<ProtectedRoute><PosFloorView /></ProtectedRoute>} />
          <Route path="/pos/:config_id/order/:table_id" element={<ProtectedRoute><PosOrderScreen /></ProtectedRoute>} />
          <Route path="/pos/:config_id/payment/:order_id" element={<ProtectedRoute><PosPaymentScreen /></ProtectedRoute>} />
          <Route path="/pos/:config_id/confirmation" element={<ProtectedRoute><PosConfirmation /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
