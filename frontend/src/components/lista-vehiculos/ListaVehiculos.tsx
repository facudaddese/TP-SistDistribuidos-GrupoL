import { Link } from "react-router-dom";
import { OBTENER_TODOS_LOS_VEHICULOS } from "../../graphql/queries";
import { useQuery } from "@apollo/client/react";

interface VehiculoGraphQL {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: string;
  precioDiario: number;
  patente: string;
  color: string;
}

interface ObtenerTodosData {
  obtenerTodosLosVehiculos: VehiculoGraphQL[];
}

const ListaVehiculos = () => {
  const { data, loading, error } = useQuery<ObtenerTodosData>(
    OBTENER_TODOS_LOS_VEHICULOS,
  );

  const vehiculos = data?.obtenerTodosLosVehiculos || [];

  return (
    <section className="p-6 bg-gray-50/5 min-h-screen flex flex-col justify-between">
      <div>
        {/* Cabecera con botón de consulta de disponibles */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <h2 className="text-[35px] text-gray-100 font-medium">
            Nuestra flota de vehículos
          </h2>

          <Link
            to="/consultar-disponibilidad"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors text-sm font-semibold"
          >
            Consultar autos disponibles
          </Link>
        </div>

        {/* Mensajes de carga / error */}
        {loading && (
          <p className="text-gray-300 text-center py-8">Cargando flota...</p>
        )}
        {error && (
          <p className="text-red-400 text-center py-8">
            Error al cargar la flota de vehículos.
          </p>
        )}

        {/* Grilla de Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehiculos.map((v) => (
              <div
                key={v.id}
                className="p-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-bold tracking-wide">
                      {v.marca} {v.modelo}
                    </h3>
                    <span className="text-xs bg-gray-700/80 px-2 py-1 rounded text-gray-300">
                      {v.anio}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 uppercase tracking-wider font-semibold">
                    Tipo: {v.tipo}
                  </p>

                  <div className="pt-2">
                    <span className="text-2xl font-extrabold text-green-400">
                      ${v.precioDiario}
                    </span>
                    <span className="text-xs text-gray-400"> / día</span>
                  </div>
                </div>

                {/* Botón Reservar por card */}
                <Link
                  to={`/reservar?vehiculoId=${v.id}`}
                  className="mt-6 w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-md transition-colors"
                >
                  Reservar
                </Link>
              </div>
            ))}

            {vehiculos.length === 0 && (
              <p className="text-gray-400 col-span-full text-center py-8">
                No hay vehículos registrados.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ListaVehiculos;
