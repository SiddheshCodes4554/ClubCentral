import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Redirect } from 'wouter';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Redirect to="/login" />;
  }

  if (user.kind !== 'club') {
    return <Redirect to="/institution/dashboard" />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

export function InstitutionProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Redirect to="/login" />;
  }

  if (user.kind !== 'institution') {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}
