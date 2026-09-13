import { Link } from "react-router-dom";

const ListaVehiculos = () => {
  return (
    //Cada card va a tener un btn Reservar
    //Esta seccion va a tener un btn para poder consultar todos los autos que esten disponbibles
    <section className="flex items-center gap-10 p-4 bg-gray-50/5">
      <h2 className="text-[35px] text-gray-100 font-medium">
        Nuestra flota de vehículos
      </h2>
      {/* Ver diponibilidad */}
      <Link
        to="/consultar-disponibilidad"
        className="text-[15px] text-blue-400 underline cursor-pointer hover:text-blue-300"
      >
        Ver todos los vehículos
      </Link>
    </section>
  );
};

export default ListaVehiculos;
