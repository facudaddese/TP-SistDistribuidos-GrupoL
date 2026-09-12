import { Link } from "react-router-dom";

const ListaVehiculos = () => {
  return (
    <section>
      <Link to="/vehiculos">
        <h2 className="text-white font-medium text-[35px]">Vehículos</h2>
      </Link>
    </section>
  );
};

export default ListaVehiculos;
