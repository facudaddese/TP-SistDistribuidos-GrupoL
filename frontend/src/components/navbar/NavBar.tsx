import { Link } from "react-router-dom";

const styleLi =
  "cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-b";

const NavBar = () => {
  return (
    <nav className="flex items-center justify-end p-4">
      <h1 className="text-white text-[45px] font-bold w-full text-center">
        Alquileres de vehículos en Argentina
      </h1>
      <div className="absolute">
        <ul className="flex items-center justify-center gap-5 text-white text-[14px]">
          <li>
            <Link to="/clientes" className={`${styleLi}`}>
              Clientes
            </Link>
          </li>
          <li>
            <Link to="/reservar" className={`${styleLi}`}>
              Reservar
            </Link>
          </li>
          <li>
            <Link to="/historial-alquileres" className={`${styleLi}`}>
              Historial de alquileres
            </Link>
          </li>
          <li>
            <Link to="/mis-reservas" className={`${styleLi}`}>
              Mis reservas
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
