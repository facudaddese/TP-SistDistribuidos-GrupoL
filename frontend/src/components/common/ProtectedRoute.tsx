import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import type { Rol } from "../../types/Auth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Rol[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, rol, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-white">
        <p>Cargando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRolNormalizado = (rol || "")
      .toString()
      .replace(/^ROLE_/, "")
      .toUpperCase();

    const tienePermiso = allowedRoles.some((r) => {
      const allowedNormalizado = r
        .toString()
        .replace(/^ROLE_/, "")
        .toUpperCase();

      if (userRolNormalizado === allowedNormalizado) return true;
      if (
        allowedNormalizado === "ADMINISTRADOR" &&
        userRolNormalizado === "ADMIN"
      )
        return true;
      if (
        allowedNormalizado === "ADMIN" &&
        userRolNormalizado === "ADMINISTRADOR"
      )
        return true;

      return false;
    });

    if (!tienePermiso) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
