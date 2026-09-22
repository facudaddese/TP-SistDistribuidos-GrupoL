import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { vehiculosApi } from "../../api/vehiculos";
import { ApiError } from "../../api/httpClient";
import type {
  Tipo,
  VehiculoRequest,
  VehiculoUpdateRequest,
  VehiculoResponse,
} from "../../types/Vehiculo";

const tipos: Tipo[] = ["SEDAN", "SUV", "PICKUP", "COUPE", "HATCHBACK"];

const emptyForm: VehiculoRequest = {
  patente: "",
  marca: "",
  modelo: "",
  anio: new Date().getFullYear(),
  color: "",
  tipoVehiculo: "SEDAN",
  precioDiario: 0,
};

const AdminVehiculos = () => {
  const [vehiculos, setVehiculos] = useState<VehiculoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<VehiculoRequest>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cargarVehiculos = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await vehiculosApi.listar();
      const lista = Array.isArray(data)
        ? data
        : (data as any)?.vehiculos || (data as any)?.content || [];
      setVehiculos(lista);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cargar el listado de vehículos.",
      );
      setVehiculos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      cargarVehiculos();
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await vehiculosApi.listar();
        const lista = Array.isArray(data)
          ? data
          : (data as any)?.vehiculos || (data as any)?.content || [];
        if (isMounted) setVehiculos(lista);
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudo cargar el listado de vehículos.",
          );
          setVehiculos([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, []);

  const abrirNuevo = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const abrirEdicion = (v: VehiculoResponse) => {
    setEditingId(v.id);
    setForm({
      patente: v.patente,
      marca: v.marca,
      modelo: v.modelo,
      anio: v.anio,
      color: v.color,
      tipoVehiculo: v.tipoVehiculo,
      precioDiario: v.precioDiario,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const cerrarDialog = () => setDialogOpen(false);

  const guardar = async () => {
    setFormError(null);

    if (!form.patente || !form.marca || !form.modelo) {
      setFormError("Patente, marca y modelo son obligatorios.");
      return;
    }
    if (form.anio < 1900) {
      setFormError("El año no es válido.");
      return;
    }
    if (form.precioDiario <= 0) {
      setFormError("El precio diario debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    try {
      if (editingId === null) {
        await vehiculosApi.crear(form);
      } else {
        const {
          patente: _patente,
          ...update
        }: VehiculoUpdateRequest & {
          patente?: string;
        } = form;
        await vehiculosApi.actualizar(editingId, update);
      }
      setDialogOpen(false);
      await cargarVehiculos();
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el vehículo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const darDeBaja = async (v: VehiculoResponse) => {
    if (!confirm(`¿Dar de baja el vehículo ${v.patente}?`)) return;
    try {
      await vehiculosApi.darDeBaja(v.id);
      await cargarVehiculos();
    } catch (err) {
      alert(
        err instanceof ApiError
          ? err.message
          : "No se pudo dar de baja el vehículo.",
      );
    }
  };

  return (
    <section className="mx-10 p-4 bg-gray-50/5">
      <div className="flex items-center justify-between py-4">
        <h2 className="text-[35px] text-gray-100 font-medium">
          Gestión de vehículos
        </h2>
        <Button variant="contained" onClick={abrirNuevo}>
          Nuevo vehículo
        </Button>
      </div>

      {loading && <p className="text-gray-100 text-center py-4">Cargando...</p>}
      {error && <p className="text-red-400 text-center py-4">{error}</p>}

      {!loading && !error && (
        <TableContainer
          component={Paper}
          sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                {[
                  "Patente",
                  "Marca",
                  "Modelo",
                  "Año",
                  "Tipo",
                  "Precio diario",
                  "Estado",
                  "Activo",
                  "",
                ].map((h) => (
                  <TableCell key={h} sx={{ color: "#f3f4f6", fontWeight: 600 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(vehiculos) &&
                vehiculos.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell sx={{ color: "#f3f4f6" }}>{v.patente}</TableCell>
                    <TableCell sx={{ color: "#f3f4f6" }}>{v.marca}</TableCell>
                    <TableCell sx={{ color: "#f3f4f6" }}>{v.modelo}</TableCell>
                    <TableCell sx={{ color: "#f3f4f6" }}>{v.anio}</TableCell>
                    <TableCell sx={{ color: "#f3f4f6" }}>
                      {v.tipoVehiculo}
                    </TableCell>
                    <TableCell sx={{ color: "#f3f4f6" }}>
                      ${v.precioDiario}
                    </TableCell>
                    <TableCell sx={{ color: "#f3f4f6" }}>{v.estado}</TableCell>
                    <TableCell>
                      <Chip
                        label={v.activo ? "Activo" : "Inactivo"}
                        color={v.activo ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => abrirEdicion(v)}
                        disabled={!v.activo}
                      >
                        <EditIcon
                          sx={{ color: v.activo ? "#3b82f6" : "#6b7280" }}
                          fontSize="small"
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => darDeBaja(v)}
                        disabled={!v.activo}
                      >
                        <DeleteIcon
                          sx={{ color: "#f87171" }}
                          fontSize="small"
                        />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {(!Array.isArray(vehiculos) || vehiculos.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    sx={{ color: "#f3f4f6", textAlign: "center" }}
                  >
                    No hay vehículos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={dialogOpen}
        onClose={cerrarDialog}
        fullWidth
        maxWidth="sm"
        disableRestoreFocus
      >
        <DialogTitle>
          {editingId === null
            ? "Nuevo vehículo"
            : `Editar vehículo #${editingId}`}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <TextField
            label="Patente"
            value={form.patente}
            onChange={(e) => setForm({ ...form, patente: e.target.value })}
            disabled={editingId !== null}
            helperText={
              editingId !== null ? "La patente no se puede modificar" : ""
            }
          />
          <TextField
            label="Marca"
            value={form.marca}
            onChange={(e) => setForm({ ...form, marca: e.target.value })}
          />
          <TextField
            label="Modelo"
            value={form.modelo}
            onChange={(e) => setForm({ ...form, modelo: e.target.value })}
          />
          <TextField
            label="Año"
            type="number"
            value={form.anio}
            onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })}
          />
          <TextField
            label="Color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
          <TextField
            select
            label="Tipo de vehículo"
            value={form.tipoVehiculo}
            onChange={(e) =>
              setForm({ ...form, tipoVehiculo: e.target.value as Tipo })
            }
          >
            {tipos.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Precio diario"
            type="number"
            value={form.precioDiario}
            onChange={(e) =>
              setForm({ ...form, precioDiario: Number(e.target.value) })
            }
          />
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialog}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
};

export default AdminVehiculos;
