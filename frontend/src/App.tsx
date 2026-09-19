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

function App() {
  return (
    <div
      className="min-h-screen bg-center bg-cover bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${home})` }}
    >
      <NavBar />
      <Routes>
        <Route path="/reservar" element={<Reservar />} />
        <Route path="/clientes" element={<Cliente />} />
        <Route path="/historial-alquileres" element={<HistorialAlquileres />} />
        <Route path="/reservas" element={<MisReservas />} />
        <Route
          path="/consultar-disponibilidad"
          element={<ConsultarDisponibilidad />}
        />
        <Route path="/admin/vehiculos" element={<AdminVehiculos />} />
        <Route path="/" element={<MainLayout />} />
        <Route path="*" element={<h4>404</h4>} />
      </Routes>
    </div>
  );
}

export default App;
