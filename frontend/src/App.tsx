import MainLayout from "./components/main-layout/MainLayout";
import NavBar from "./components/navbar/NavBar";
import home from "./assets/img/home.jpg";
import { Route, Routes } from "react-router-dom";
import Reservar from "./components/reservar/Reservar";
import Cliente from "./components/cliente/Cliente";
import AdminVehiculos from "./components/admin/AdminVehiculos";
import HistorialAlquileres from "./components/historial-alquileres/HistorialAlquileres";
import MisReservas from "./components/mis-reservas/MisReservas";
import ConsultarDisponibilidad from "./components/consultar-disponibilidad/ConsultarDisponibilidad";
import Login from "./components/login/Login";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/admin/AdminRoute";
import Unauthorized from "./components/common/Unauthorized";

function App() {
  return (
    <div
      className="min-h-screen bg-center bg-cover bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${home})` }}
    >
      <NavBar />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<MainLayout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/consultar-disponibilidad" element={<ConsultarDisponibilidad />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Rutas exclusivas para ADMINISTRADOR */}
        <Route
          path="/admin/vehiculos"
          element={
            <AdminRoute>
              <AdminVehiculos />
            </AdminRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <AdminRoute>
              <Cliente />
            </AdminRoute>
          }
        />

        {/* Rutas exclusivas para CLIENTE */}
        <Route
          path="/reservar"
          element={
            <ProtectedRoute allowedRoles={["CLIENTE"]}>
              <Reservar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/historial-alquileres"
          element={
            <ProtectedRoute allowedRoles={["CLIENTE"]}>
              <HistorialAlquileres />
            </ProtectedRoute>
          }
        />

        {/* Rutas accesibles por cualquier usuario autenticado (Cliente o Admin) */}
        <Route
          path="/reservas"
          element={
            <ProtectedRoute>
              <MisReservas />
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 */}
        <Route
          path="*"
          element={
            <div className="flex justify-center items-center min-h-[50vh] text-white">
              <h2 className="text-3xl font-bold">404 - Página no encontrada</h2>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
