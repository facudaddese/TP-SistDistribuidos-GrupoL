import { useEffect, useState } from "react";
import { TextField, MenuItem, Button, Box } from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import { vehiculosApi } from "../../api/vehiculos";
import { reservasApi } from "../../api/reservas";
import { ApiError } from "../../api/httpClient";
import type { VehiculoResponse } from "../../types/Vehiculo";
import type { ReservaResponse } from "../../types/Reserva";

const inputStyles = {
  "& .MuiInputLabel-root": { color: "#f3f4f6" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
  "& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root": {
    color: "#f3f4f6",
    "& fieldset, & .MuiPickersOutlinedInput-notchedOutline": {
      borderColor: "#3b82f6",
    },
    "&:hover fieldset, &:hover .MuiPickersOutlinedInput-notchedOutline": {
      borderColor: "#f3f4f6",
    },
    "&.Mui-focused fieldset, &.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
      { borderColor: "#f3f4f6" },
    "& .MuiSvgIcon-root": { color: "#f3f4f6" },
  },
};

const Reservar = () => {
  const [clienteId, setClienteId] = useState("");

  const [vehiculos, setVehiculos] = useState<VehiculoResponse[]>([]);
  const [vehiculoId, setVehiculoId] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);

  const [reservaCreada, setReservaCreada] = useState<ReservaResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    vehiculosApi
      .listar()
      .then((data) =>
        setVehiculos(data.filter((v) => v.activo && v.estado === "DISPONIBLE")),
      )
      .catch(() =>
        setError("No se pudieron cargar los vehículos disponibles."),
      );
  }, []);

  const handleReservar = async () => {
    setError(null);

    if (!clienteId || !vehiculoId || !fechaInicio || !fechaFin) {
      setError("Completá cliente, vehículo y ambas fechas.");
      return;
    }
    if (!fechaInicio.isAfter(dayjs())) {
      setError("La fecha de inicio debe ser futura.");
      return;
    }
    if (!fechaFin.isAfter(fechaInicio)) {
      setError("La fecha de finalización debe ser posterior a la de inicio.");
      return;
    }

    setLoading(true);
    try {
      const reserva = await reservasApi.crear({
        clienteId: Number(clienteId),
        vehiculoId: Number(vehiculoId),
        fechaHoraInicio: fechaInicio.toISOString(),
        fechaHoraFin: fechaFin.toISOString(),
      });

      setReservaCreada(reserva);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo crear la reserva.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!reservaCreada) return;
    if (!confirm("¿Cancelar esta reserva?")) return;

    setLoading(true);
    try {
      const actualizada = await reservasApi.cancelar(reservaCreada.id);
      setReservaCreada(actualizada);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cancelar la reserva.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-50/5 p-4 mx-10">
      <h2 className="text-[35px] text-gray-100 font-medium py-4">Reservar</h2>

      {vehiculos.length === 0 ? (
        <div className="my-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-200 text-center font-medium">
          No hay vehículos disponibles en este momento para reservar.
        </div>
      ) : (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, p: 3 }}>
            <TextField
              label="Cliente ID (temporal, sin login)"
              type="number"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              sx={{ minWidth: 220, ...inputStyles }}
            />

            <TextField
              select
              label="Vehículo disponible"
              value={vehiculoId}
              onChange={(e) => setVehiculoId(e.target.value)}
              sx={{ minWidth: 260, ...inputStyles }}
            >
              {vehiculos.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.marca} {v.modelo} — {v.patente} (${v.precioDiario}/día)
                </MenuItem>
              ))}
            </TextField>

            <DateTimePicker
              label="Fecha y hora de inicio"
              value={fechaInicio}
              onChange={setFechaInicio}
              minDateTime={dayjs()}
              slotProps={{ textField: { sx: inputStyles } }}
            />
            <DateTimePicker
              label="Fecha y hora de fin"
              value={fechaFin}
              onChange={setFechaFin}
              minDateTime={fechaInicio ?? dayjs()}
              slotProps={{ textField: { sx: inputStyles } }}
            />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", pb: 3 }}>
            <Button
              variant="contained"
              onClick={handleReservar}
              disabled={loading}
            >
              {loading ? "Procesando..." : "Reservar"}
            </Button>
          </Box>
        </LocalizationProvider>
      )}

      {error && <p className="text-red-400 text-center py-2">{error}</p>}

      {reservaCreada && (
        <Box
          sx={{
            maxWidth: 480,
            mx: "auto",
            bgcolor: "rgba(255,255,255,0.05)",
            borderRadius: 2,
            p: 3,
            color: "#f3f4f6",
          }}
        >
          <p className="font-bold text-lg pb-2">Reserva #{reservaCreada.id}</p>
          {reservaCreada.vehiculo && (
            <p>
              Vehículo: {reservaCreada.vehiculo.marca}{" "}
              {reservaCreada.vehiculo.modelo} ({reservaCreada.vehiculo.patente})
            </p>
          )}
          <p>Importe total: ${reservaCreada.importeTotal}</p>
          <p>Estado: {reservaCreada.estado}</p>

          {reservaCreada.estado === "CONFIRMADA" && (
            <Box sx={{ pt: 2 }}>
              <Button color="error" variant="outlined" onClick={handleCancelar}>
                Cancelar reserva
              </Button>
            </Box>
          )}
        </Box>
      )}
    </section>
  );
};

export default Reservar;
