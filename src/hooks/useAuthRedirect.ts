import { useLocation, useNavigate } from 'react-router';

export function useAuthRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const redirectAfterAuth = () => {
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };
  
  return { redirectAfterAuth };
}