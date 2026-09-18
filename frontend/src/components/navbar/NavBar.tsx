import { Link } from "react-router-dom";
import { useRol } from "../../context/RolContext";

const styleLink = "cursor-pointer hover:border-b";
const styleLi =
  "transition-transform duration-300 ease-out hover:-translate-y-0.5";

const NavBar = () => {

  const { rol, setRol } = useRol();


  return (
    <nav className="grid items-center py-5 px-10 grid-cols-1 grid-rows-2 lg:grid-cols-3 lg:grid-rows-1">
      <div className="hidden lg:block" />
      <h1 className="text-white text-[45px] font-bold text-center hover:opacity-70">
        <Link to="/">Rentar</Link>
      </h1>
      
      <ul className="flex items-center gap-5 text-white text-[14px] justify-center lg:justify-end">

        {rol ==='ADMINISTRADOR' && (
          <>
            <li className={`${styleLi}`} >
              <Link to="/admin/vehiculos" className={`${styleLink}`}>
                Vehiculos
              </Link>
            </li>
            <li className={`${styleLi}`} >
              <Link to="/clientes" className={`${styleLink}`} >
              Clientes</Link>
            </li>
          </>
        )}

        {rol === 'CLIENTE' && (
          <li className={`${styleLi}`}>
            <Link to="/reservar" className={`${styleLink}`}>
              Reservar
            </Link>
          </li>
        )}

        <li className={`${styleLi}`}>
          <Link to="/reservas" className={`${styleLink}`}>
            Reservas
          </Link>
        </li>
        <li className={`${styleLi}`}>
          <Link to="/historial-alquileres" className={`${styleLink}`}>
            Historial de alquileres
          </Link>
        </li>

        <li>
          <select 
            value={rol}
            onChange={(e) => setRol(e.target.value as typeof rol)}
            className="bg-gray-800 text-white text-[12px] rounded px-2 py-1"
          >
            <option value="CLIENTE">Ver como Cliente</option>
            <option value="ADMINISTRADOR">Ver como Admin</option>
          </select>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;
