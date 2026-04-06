import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Trappers from './pages/Trappers';
import TrapperDetail from './pages/TrapperDetail';
import FilterConfig from './pages/FilterConfig';
import WebhookListener from './pages/WebhookListener';
import QueueDashboard from './pages/QueueDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/trappers" element={<Trappers />} />
          <Route path="/trappers/:id" element={<TrapperDetail />} />
          <Route path="/trappers/:id/configure" element={<FilterConfig />} />
          <Route path="/trappers/:id/listen" element={<WebhookListener />} />
          <Route path="/queue" element={<QueueDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
