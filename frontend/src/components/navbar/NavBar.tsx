import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const styleLink = "cursor-pointer hover:border-b text-gray-200 hover:text-white transition-colors";
const styleLi = "transition-transform duration-300 ease-out hover:-translate-y-0.5";

const NavBar = () => {
  const { user, rol, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="flex flex-col lg:flex-row items-center justify-between py-5 px-6 lg:px-10 gap-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
      {/* Logo */}
      <h1 className="text-white text-3xl lg:text-4xl font-extrabold tracking-wide hover:opacity-85 transition-opacity">
        <Link to="/">Rentar</Link>
      </h1>

      {/* Navigation links */}
      <ul className="flex flex-wrap items-center gap-5 text-white text-[14px] justify-center">
        {/* Catálogo público disponible para todos */}
        <li className={styleLi}>
          <Link to="/" className={styleLink}>
            Inicio
          </Link>
        </li>
        <li className={styleLi}>
          <Link to="/consultar-disponibilidad" className={styleLink}>
            Disponibilidad
          </Link>
        </li>

        {/* Rutas exclusivas ADMINISTRADOR */}
        {isAuthenticated && rol === "ADMINISTRADOR" && (
          <>
            <li className={styleLi}>
              <Link to="/admin/vehiculos" className={styleLink}>
                Gestión Vehículos
              </Link>
            </li>
            <li className={styleLi}>
              <Link to="/clientes" className={styleLink}>
                Gestión Clientes
              </Link>
            </li>
            <li className={styleLi}>
              <Link to="/reservas" className={styleLink}>
                Todas las Reservas
              </Link>
            </li>
          </>
        )}

        {/* Rutas exclusivas CLIENTE */}
        {isAuthenticated && rol === "CLIENTE" && (
          <>
            <li className={styleLi}>
              <Link to="/reservar" className={styleLink}>
                Reservar
              </Link>
            </li>
            <li className={styleLi}>
              <Link to="/reservas" className={styleLink}>
                Mis Reservas
              </Link>
            </li>
            <li className={styleLi}>
              <Link to="/historial-alquileres" className={styleLink}>
                Historial de alquileres
              </Link>
            </li>
          </>
        )}
      </ul>

      {/* Auth state controls */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white">
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                rol === "ADMINISTRADOR"
                  ? "bg-blue-600/80 text-blue-100"
                  : "bg-emerald-600/80 text-emerald-100"
              }`}
            >
              {rol}
            </span>
            <span className="font-medium hidden sm:inline max-w-[160px] truncate" title={user.email}>
              {user.nombreCompleto || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 font-semibold cursor-pointer pl-1 hover:underline"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-md"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
