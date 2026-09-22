import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { HISTORIAL_ALQUILERES } from "../../graphql/queries";
import type { HistorialAlquileresData } from "../../types/Vehiculo";

const HistorialAlquileres = () => {
  const [documento, setDocumento] = useState("");
  const [documentoBuscado, setDocumentoBuscado] = useState("")
  const { data, loading, error } =
    useQuery<HistorialAlquileresData>(HISTORIAL_ALQUILERES, {
      variables: { documento: documentoBuscado },
      skip: !documentoBuscado,
    });
  const buscarHistorial = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const documentoNormalizado = documento.trim();
    setDocumentoBuscado(documentoNormalizado);
  };

  return (
    <section className="bg-gray-50/5 p-4 mx-10">
      <h2 className="text-gray-100 text-[35px] font-medium py-4">
        Historial de alquileres
      </h2>

      <form
        onSubmit={buscarHistorial}
        className="flex flex-wrap items-end gap-3 pb-4"
      >
        <label className="flex flex-col gap-1 text-gray-100">
          Documento
          <input
            value={documento}
            onChange={(event) => setDocumento(event.target.value)}
            className="rounded border border-gray-400 bg-gray-900/40 px-3 py-2 text-gray-100"
            placeholder="Ingresá el documento"
            required
          />
        </label>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
        >
          Buscar
        </button>
      </form>

      {loading && <p className="text-gray-100 text-center py-4">Cargando...</p>}

      {error && (
        <p className="text-red-400 text-center py-4">
          Ocurrió un error al cargar el historial.
        </p>
      )}

      {data && data.historialAlquileres.length === 0 && (
        <p className="text-gray-100 text-center py-4">
          Todavía no tenés alquileres registrados.
        </p>
      )}

      {data && data.historialAlquileres.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-gray-100 text-left">
            <thead>
              <tr className="border-b border-gray-100/30">
                <th className="p-2">Vehículo</th>
                <th className="p-2">Patente</th>
                <th className="p-2">Fecha inicio</th>
                <th className="p-2">Fecha fin</th>
                <th className="p-2">Días</th>
                <th className="p-2">Importe total</th>
                <th className="p-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.historialAlquileres.map((alquiler) => (
                <tr key={alquiler.id} className="border-b border-gray-100/10">
                  <td className="p-2">
                    {alquiler.vehiculo.marca} {alquiler.vehiculo.modelo}
                  </td>
                  <td className="p-2">{alquiler.vehiculo.patente}</td>
                  <td className="p-2">{alquiler.fechaInicio}</td>
                  <td className="p-2">{alquiler.fechaFin}</td>
                  <td className="p-2">{alquiler.cantDias}</td>
                  <td className="p-2">${alquiler.importeTotal}</td>
                  <td className="p-2">{alquiler.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default HistorialAlquileres;
