import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Toolbar } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getMuiTheme } from './theme';

// Layout Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ContractForm } from './pages/ContractForm';
import { ReviewPage } from './pages/ReviewPage';
import { PaymentPage } from './pages/PaymentPage';
import { StatusTracking } from './pages/StatusTracking';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminReviewPage } from './pages/AdminReviewPage';
import { AuditLogs } from './pages/AuditLogs';
import { UserProfile } from './pages/UserProfile';
import { Settings } from './pages/Settings';

// Inner Layout wrapper for protected routes
const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar onToggleSidebar={handleToggleSidebar} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Content wrapper with side padding and top toolbar height margin */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 }, 
          width: { md: `calc(100% - 240px)` },
          backgroundColor: 'background.default',
          transition: 'background-color 0.2s'
        }}
      >
        <Toolbar /> {/* Offsets the fixed Navbar */}
        <Outlet />
      </Box>
    </Box>
  );
};

const RootRouter: React.FC = () => {
  const { darkMode } = useAuth();
  const activeTheme = getMuiTheme(darkMode ? 'dark' : 'light');

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Portal Layout */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            {/* Student Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/contract-form" element={
              <ProtectedRoute allowedRoles={['student']}>
                <ContractForm />
              </ProtectedRoute>
            } />
            <Route path="/review-page" element={
              <ProtectedRoute allowedRoles={['student']}>
                <ReviewPage />
              </ProtectedRoute>
            } />
            <Route path="/payment-page" element={
              <ProtectedRoute allowedRoles={['student']}>
                <PaymentPage />
              </ProtectedRoute>
            } />
            <Route path="/status-tracking" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StatusTracking />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/audit-logs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogs />
              </ProtectedRoute>
            } />
            <Route path="/admin/applications/:id" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReviewPage />
              </ProtectedRoute>
            } />

            {/* Shared Profile & Settings */}
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/settings" element={<Settings />} />

            {/* Default Route redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all unknown paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootRouter />
    </AuthProvider>
  );
}
