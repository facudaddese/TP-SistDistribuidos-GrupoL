import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const styleLink = "cursor-pointer hover:border-b";
const styleLi =
  "transition-transform duration-300 ease-out hover:-translate-y-0.5";

const NavBar = () => {
  const [isDesktop, setDesktop] = useState(window.innerWidth > 900);

  useEffect(() => {
    const resolution = () => {
      setDesktop((prev) => {
        return prev === window.innerWidth > 900 ? prev : !prev;
      });
    };
    window.addEventListener("resize", resolution);
    return () => window.removeEventListener("resize", resolution);
  }, []);

  return (
    <nav
      className={`grid items-center py-5 px-10 ${isDesktop ? "grid-cols-3 grid-rows-1" : "grid-cols-1 grid-rows-2"}`}
    >
      {isDesktop && <div />}
      <Link to="/">
        <h1 className="text-white text-[45px] font-bold text-center">Rentar</h1>
      </Link>
      <ul
        className={`flex items-center gap-5 text-white text-[14px] ${isDesktop ? "justify-end" : "justify-center"}`}
      >
        <li className={`${styleLi}`}>
          <Link to="/clientes" className={`${styleLink}`}>
            Clientes
          </Link>
        </li>
        <li className={`${styleLi}`}>
          <Link to="/mis-reservas" className={`${styleLink}`}>
            Mis reserva
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
