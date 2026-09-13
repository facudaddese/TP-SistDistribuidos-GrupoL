import { Link } from "react-router-dom";

const styleLink = "cursor-pointer hover:border-b";
const styleLi =
  "transition-transform duration-300 ease-out hover:-translate-y-0.5";

const NavBar = () => {
  return (
    <nav className="grid items-center py-5 px-10 grid-cols-1 grid-rows-2 lg:grid-cols-3 lg:grid-rows-1">
      <div className="hidden lg:block" />
      <h1 className="text-white text-[45px] font-bold text-center hover:opacity-70">
        <Link to="/">Rentar</Link>
      </h1>
      <ul className="flex items-center gap-5 text-white text-[14px] justify-center lg:justify-end">
        <li className={`${styleLi}`}>
          <Link to="/clientes" className={`${styleLink}`}>
            Clientes
          </Link>
        </li>
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
      </ul>
    </nav>
  );
};

export default NavBar;
