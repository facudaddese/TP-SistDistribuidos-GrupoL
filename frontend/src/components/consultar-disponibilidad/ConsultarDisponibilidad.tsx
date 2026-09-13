import { useState } from "react";
import { TextField, MenuItem, Button, Box } from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import type { Tipo } from "../../types/Vehiculo";
import type { ConsultarDisponibilidadData } from "../../types/Vehiculo";
import { useLazyQuery } from "@apollo/client/react";
import { CONSULTAR_DISPONIBILIDAD } from "../../graphql/queries";

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
      borderColor: "#f3f4f6",
    },
    "&:hover fieldset, &:hover .MuiPickersOutlinedInput-notchedOutline": {
      borderColor: "#f3f4f6",
    },
    "&.Mui-focused fieldset, &.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
      {
        borderColor: "#3b82f6",
      },
  },
};

const tipos: Tipo[] = ["SEDAN", "SUV", "PICKUP", "COUPE", "HATCHBACK"];

const ConsultarDisponibilidad = () => {
  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);

  const [buscarDisponibilidad, { data, loading, error }] =
    useLazyQuery<ConsultarDisponibilidadData>(CONSULTAR_DISPONIBILIDAD);

  const handleBuscar = () => {
    buscarDisponibilidad({
      variables: {
        tipo: tipo || undefined,
        marca: marca || undefined,
        modelo: modelo || undefined,
        precioMin: precioMin ? Number(precioMin) : undefined,
        precioMax: precioMax ? Number(precioMax) : undefined,
        fechaInicio: fechaInicio?.toISOString(),
        fechaFin: fechaFin?.toISOString(),
      },
    });
  };

  return (
    <section className="bg-gray-50/5 p-4 mx-10">
      <h2 className="text-gray-100 text-[35px] font-medium py-4">
        Consltar disponibilidad
      </h2>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            p: 3,
          }}
        >
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
            label="Marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            sx={inputStyles}
          />
          <TextField
            label="Modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            sx={inputStyles}
          />
          <TextField
            label="Precio mín."
            type="number"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            sx={inputStyles}
          />
          <TextField
            label="Precio máx."
            type="number"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            sx={inputStyles}
          />

          <DateTimePicker
            label="Fecha y hora de inicio"
            value={fechaInicio}
            onChange={setFechaInicio}
            slotProps={{
              textField: {
                sx: inputStyles,
              },
            }}
          />
          <DateTimePicker
            label="Fecha y hora de fin"
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
          <Button
            variant="contained"
            onClick={handleBuscar}
            disabled={!fechaInicio || !fechaFin}
          >
            Buscar
          </Button>
        </Box>
      </LocalizationProvider>

      {loading && <p className="text-gray-100 text-center py-4">Buscando...</p>}

      {error && (
        <p className="text-red-400 text-center py-4">
          Ocurrió un error al buscar disponibilidad.
        </p>
      )}

      {data && data.consultarDisponibilidad.length === 0 && (
        <p className="text-gray-100 text-center py-4">
          No hay vehículos disponibles para ese período.
        </p>
      )}

      {data && data.consultarDisponibilidad.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {data.consultarDisponibilidad.map((vehiculo) => (
            <div
              key={vehiculo.id}
              className="bg-gray-800/60 text-gray-100 rounded-lg p-4"
            >
              <p className="font-bold">
                {vehiculo.marca} {vehiculo.modelo}
              </p>
              <p>Patente: {vehiculo.patente}</p>
              <p>Año: {vehiculo.anio}</p>
              <p>Color: {vehiculo.color}</p>
              <p>Tipo: {vehiculo.tipo}</p>
              <p>Precio diario: ${vehiculo.precioDiario}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ConsultarDisponibilidad;
