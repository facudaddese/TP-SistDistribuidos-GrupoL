import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { TextField, MenuItem, Button, Box } from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import type { ConsultarReservasData, Tipo } from "../../types/Vehiculo";
import { CONSULTAR_RESERVAS } from "../../graphql/queries";

const estados = ["RESERVADO", "CANCELADA"];
const tipos: Tipo[] = ["SEDAN", "SUV", "PICKUP", "COUPE", "HATCHBACK"];

const isAdmin = false; // Revisar

const inputStyles = {
  "& .MuiInputLabel-root": {
    color: "#f3f4f6",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#3b82f6",
  },
  "& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root": {
    color: "#f3f4f6",
    "& fieldset, & .MuiPickersOutlinedInput-notchedOutline": {
      borderColor: "#3b82f6",
    },
    "&:hover fieldset, &:hover .MuiPickersOutlinedInput-notchedOutline": {
      borderColor: "#f3f4f6",
    },
    "&.Mui-focused fieldset, &.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
      {
        borderColor: "#f3f4f6",
      },
    "& .MuiSvgIcon-root": {
      color: "#f3f4f6",
    },
  },
};

const MisReservas = () => {
  const [clienteId, setClienteId] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);

  const { data, loading, error, refetch } = useQuery<ConsultarReservasData>(
    CONSULTAR_RESERVAS,
    { variables: {} },
  );

  const handleBuscar = () => {
    refetch({
      clienteId: isAdmin ? clienteId || undefined : undefined,
      vehiculoId: vehiculoId || undefined,
      tipo: tipo || undefined,
      estado: estado || undefined,
      fechaInicio: fechaInicio?.toISOString(),
      fechaFin: fechaFin?.toISOString(),
    });
  };

  return (
    <section className="bg-gray-50/5 p-4 mx-10">
      <h2 className="text-gray-100 text-[35px] font-medium py-4">
        Mis reservas
      </h2>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, p: 3 }}>
          {isAdmin && (
            <TextField
              label="Cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              sx={inputStyles}
            />
          )}

          <TextField
            label="Vehículo"
            value={vehiculoId}
            onChange={(e) => setVehiculoId(e.target.value)}
            sx={inputStyles}
          />

          <TextField
            select
            label="Tipo de vehículo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            sx={{ minWidth: 180, ...inputStyles }}
          >
            <MenuItem value="">Todos</MenuItem>
            {tipos.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            sx={{ minWidth: 180, ...inputStyles }}
          >
            <MenuItem value="">Todos</MenuItem>
            {estados.map((e) => (
              <MenuItem key={e} value={e}>
                {e}
              </MenuItem>
            ))}
          </TextField>

          <DateTimePicker
            label="Fecha inicio"
            value={fechaInicio}
            onChange={setFechaInicio}
            slotProps={{
              textField: {
                sx: inputStyles,
              },
            }}
          />
          <DateTimePicker
            label="Fecha fin"
            value={fechaFin}
            onChange={setFechaFin}
            slotProps={{
              textField: {
                sx: inputStyles,
              },
            }}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", pb: 3 }}>
          <Button variant="contained" onClick={handleBuscar}>
            Buscar
          </Button>
        </Box>
      </LocalizationProvider>

      {loading && <p className="text-gray-100 text-center py-4">Cargando...</p>}

      {error && (
        <p className="text-red-400 text-center py-4">
          Ocurrió un error al buscar reservas.
        </p>
      )}

      {data && data.consultarReservas.length === 0 && (
        <p className="text-gray-100 text-center py-4">
          No se encontraron reservas.
        </p>
      )}

      {data && data.consultarReservas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-gray-100 text-left">
            <thead>
              <tr className="border-b border-gray-100/30">
                {isAdmin && <th className="p-2">Cliente</th>}
                <th className="p-2">Vehículo</th>
                <th className="p-2">Patente</th>
                <th className="p-2">Fecha inicio</th>
                <th className="p-2">Fecha fin</th>
                <th className="p-2">Precio diario</th>
                <th className="p-2">Importe total</th>
                <th className="p-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.consultarReservas.map((r) => (
                <tr key={r.id} className="border-b border-gray-100/10">
                  {isAdmin && (
                    <td className="p-2">
                      {r.cliente.nombre} {r.cliente.apellido}
                    </td>
                  )}
                  <td className="p-2">
                    {r.vehiculo.marca} {r.vehiculo.modelo}
                  </td>
                  <td className="p-2">{r.vehiculo.patente}</td>
                  <td className="p-2">{r.fechaInicio}</td>
                  <td className="p-2">{r.fechaFin}</td>
                  <td className="p-2">${r.precioDiario}</td>
                  <td className="p-2">${r.importeTotal}</td>
                  <td className="p-2">{r.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default MisReservas;
