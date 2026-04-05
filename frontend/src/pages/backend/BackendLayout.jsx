import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { Badge } from '../../components/Badge';

export default function BackendLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Odoo Cafe</h2>
          <p>Administration</p>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Sales</div>
          <NavLink to="/backend" end>POS Terminals</NavLink>
          <NavLink to="/backend/orders">Orders</NavLink>
          <NavLink to="/backend/payments">Payments</NavLink>
          <NavLink to="/backend/customers">Customers</NavLink>
          
          <div className="nav-section">Catalog</div>
          <NavLink to="/backend/products">Products</NavLink>
          <NavLink to="/backend/categories">Categories</NavLink>
          
          {user?.role === 'admin' && (
            <>
              <div className="nav-section">Configuration</div>
              <NavLink to="/backend/floors">Floors & Tables</NavLink>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="nav-section">Reporting</div>
              <NavLink to="/backend/reports">Dashboard</NavLink>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-title">Backend Administration</div>
          
          <div className="dropdown" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <button className="btn btn-ghost" style={{ padding: '4px 8px' }}>
              <div className="flex gap-2 align-center">
                <span className="font-semibold">{user?.name}</span>
                <Badge variant={user?.role}>{user?.role}</Badge>
              </div>
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => navigate('/login')}>Switch User</button>
                <div style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />
                <button className="dropdown-item danger" onClick={handleLogout}>Log out</button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content bg">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
