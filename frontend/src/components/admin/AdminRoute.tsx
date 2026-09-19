import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useRol } from "../../context/RolContext";

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { rol } = useRol();

  if (rol !== "ADMINISTRADOR") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
