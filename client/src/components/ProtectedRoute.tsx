import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../api/client';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('trapper_token');
    if (!token) {
      setValidating(false);
      setValid(false);
      return;
    }

    api.get('/auth/me')
      .then(() => setValid(true))
      .catch(() => {
        localStorage.removeItem('trapper_token');
        setValid(false);
      })
      .finally(() => setValidating(false));
  }, []);

  if (validating) return null;

  if (!valid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
