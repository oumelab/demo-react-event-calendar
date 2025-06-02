// src/hooks/useAuthRedirect.ts
import { useLocation, useNavigate } from 'react-router';

export function useAuthRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const redirectAfterAuth = () => {
    // デバッグ用ログ
    console.log('🔍 useAuthRedirect - location:', location);
    console.log('🔍 useAuthRedirect - location.state:', location.state);
    console.log('🔍 useAuthRedirect - location.state?.from:', location.state?.from);
    
    // location.state?.from は ProtectedRoute から渡される
    const from = location.state?.from?.pathname || '/';
    console.log('🔍 useAuthRedirect - redirecting to:', from);
    
    navigate(from, { replace: true });
  };
  
  return { redirectAfterAuth };
}