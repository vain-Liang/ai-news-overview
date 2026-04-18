import type { PropsWithChildren } from "react";
import { Navigate } from "react-router";

import { useAuth } from "../../features/auth/hooks/useAuth";

const FullScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-muted-foreground">
    Loading session…
  </div>
);

export const PublicOnlyRoute = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const ProtectedAuthRoute = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
