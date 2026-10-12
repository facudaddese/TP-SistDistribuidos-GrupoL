import type { ReactNode } from "react";
import ProtectedRoute from "../common/ProtectedRoute";

const AdminRoute = ({ children }: { children: ReactNode }) => {
  return <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>{children}</ProtectedRoute>;
};

export default AdminRoute;
