import ConsultarDisponibilidad from "../consultar-disponibilidad/ConsultarDisponibilidad";
import Reservar from "../reservar/Reservar";

const ListaVehiculos = () => {
  return (
    <section>
      <h2 className="text-white font-medium text-[35px]">
        Nuestra flota de autos
      </h2>
      <ConsultarDisponibilidad />
      <Reservar />
    </section>
  );
};

export default ListaVehiculos;
