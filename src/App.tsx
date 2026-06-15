/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import { useEffect, useState } from 'react';
import { storage } from './lib/storage';

export default function App() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const active = storage.getActiveAdmin();
    setAdminEmail(active);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eefaff]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0877b9] border-t-transparent" />
      </div>
    );
  }

  const handleLogout = () => {
    storage.setActiveAdmin(null);
    setAdminEmail(null);
  };

  const handleLogin = (email: string) => {
    storage.setActiveAdmin(email);
    setAdminEmail(email);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={adminEmail ? <Navigate to="/admin" /> : <LoginPage onLogin={handleLogin} />} />
        <Route
          path="/admin/*"
          element={adminEmail ? <AdminPage onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

