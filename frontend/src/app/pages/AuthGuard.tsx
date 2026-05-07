import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../services/supabaseClient';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/', { replace: true });
      } else {
        setAuthenticated(true);
      }
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthenticated(false);
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Verifying session...</span>
        </div>
      </div>
    );
  }

  return authenticated ? <>{children}</> : null;
}
