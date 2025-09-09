import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../store/user';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const login = useUser((s) => s.login);

  useEffect(() => {
    const token = params.get('token');
    const name = params.get('name') || '';
    const email = params.get('email') || '';
    const role = (params.get('role') as any) || 'customer';
    if (token) {
      login({ id: 'oauth', name, email, role, token });
      toast.success('Connexion via OAuth réussie');
      if (role === 'admin') navigate('/admin', { replace: true });
      else navigate('/', { replace: true });
    } else {
      toast.error('Échec de la connexion OAuth');
      navigate('/login', { replace: true });
    }
  }, []);

  return <div style={{ maxWidth: 640, margin: '32px auto', padding: '0 16px' }}>Connexion en cours...</div>;
}
