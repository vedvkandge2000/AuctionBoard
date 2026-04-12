import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const useRoleGuard = (...allowedRoles) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
};

export default useRoleGuard;
