import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function AuthSplash() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg">
      <div className="flex flex-col items-center gap-3 text-muted">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-white motion-safe:animate-pulse-dot">
          <Dumbbell size={24} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <p className="font-display text-sm font-bold uppercase tracking-[0.2em]">Loading…</p>
      </div>
    </div>
  );
}

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <AuthSplash />;
  if (status === 'anonymous') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
