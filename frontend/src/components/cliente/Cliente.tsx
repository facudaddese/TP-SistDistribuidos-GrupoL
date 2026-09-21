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
  IconButton,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { clientesApi } from "../../api/clientes";
import { ApiError } from "../../api/httpClient";
import type {
  ClienteRequest,
  ClienteUpdateRequest,
  ClienteResponse,
} from "../../types/Cliente";

interface ApiResponseWrapper {
  clientes?: ClienteResponse[];
  content?: ClienteResponse[];
}

const emptyForm: ClienteRequest = {
  documento: "",
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  telefono: "",
  fechaNacimiento: "",
};

const Cliente = () => {
  const [clientes, setClientes] = useState<ClienteResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClienteRequest>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cargarClientes = async (isMounted = true) => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientesApi.listar();
      const wrapper = data as ApiResponseWrapper;
      const lista = Array.isArray(data)
        ? data
        : wrapper?.clientes || wrapper?.content || [];

      if (isMounted) {
        setClientes(lista);
      }
    } catch (err) {
      if (isMounted) {
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el listado de clientes.",
        );
        setClientes([]);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (isMounted) {
        cargarClientes(isMounted);
      }
    });

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

  const abrirEdicion = (c: ClienteResponse) => {
    setEditingId(c.id);
    setForm({
      documento: c.documento,
      nombre: c.nombre,
      apellido: c.apellido,
      email: c.email,
      password: "", // no se toca en edición
      telefono: c.telefono,
      fechaNacimiento: c.fechaNacimiento,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const cerrarDialog = () => setDialogOpen(false);

  const validarEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const guardar = async () => {
    setFormError(null);

    if (!form.documento || !form.nombre || !form.apellido || !form.email) {
      setFormError("Documento, nombre, apellido y email son obligatorios.");
      return;
    }
    if (!validarEmail(form.email)) {
      setFormError("El email no tiene un formato válido.");
      return;
    }
    if (editingId === null && form.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSaving(true);
    try {
      if (editingId === null) {
        await clientesApi.crear(form);
      } else {
        const update: ClienteUpdateRequest = {
          documento: form.documento,
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          telefono: form.telefono,
          fechaNacimiento: form.fechaNacimiento,
        };
        await clientesApi.actualizar(editingId, update);
      }
      setDialogOpen(false);
      await cargarClientes();
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(false);
    }
  };

  const darDeBaja = async (c: ClienteResponse) => {
    if (!confirm(`¿Dar de baja al cliente ${c.nombre} ${c.apellido}?`)) return;
    try {
      await clientesApi.darDeBaja(c.id);
      await cargarClientes();
    } catch (err) {
      alert(
        err instanceof ApiError
          ? err.message
          : "No se pudo dar de baja al cliente.",
      );
    }
  };

  return (
    <section className="mx-10 p-4 bg-gray-50/5">
      <div className="flex items-center justify-between py-4">
        <h2 className="text-[35px] text-gray-100 font-medium">
          Gestión de clientes
        </h2>
        <Button variant="contained" onClick={abrirNuevo}>
          Nuevo cliente
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
                  "Documento",
                  "Nombre",
                  "Apellido",
                  "Email",
                  "Teléfono",
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
              {Array.isArray(clientes) &&
                clientes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell sx={{ color: "#f3f4f6" }}>
                      {c.documento}
                    </TableCell>
                    <TableCell sx={{ color: "#f3f4f6" }}>{c.nombre}</TableCell>
                    <TableCell sx={{ color: "#f3f4f6" }}>
                      {c.apellido}
                    </TableCell>
                    <TableCell sx={{ color: "#f3f4f6" }}>{c.email}</TableCell>
                    <TableCell sx={{ color: "#f3f4f6" }}>
                      {c.telefono}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.activo ? "Activo" : "Inactivo"}
                        color={c.activo ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => abrirEdicion(c)}>
                        <EditIcon sx={{ color: "#3b82f6" }} fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => darDeBaja(c)}
                        disabled={!c.activo}
                      >
                        <DeleteIcon
                          sx={{ color: "#f87171" }}
                          fontSize="small"
                        />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {(!Array.isArray(clientes) || clientes.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    sx={{ color: "#f3f4f6", textAlign: "center" }}
                  >
                    No hay clientes registrados.
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
            ? "Nuevo cliente"
            : `Editar cliente #${editingId}`}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <TextField
            label="Documento"
            value={form.documento}
            onChange={(e) => setForm({ ...form, documento: e.target.value })}
          />
          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <TextField
            label="Apellido"
            value={form.apellido}
            onChange={(e) => setForm({ ...form, apellido: e.target.value })}
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {editingId === null && (
            <TextField
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              helperText="Mínimo 6 caracteres"
            />
          )}
          <TextField
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />
          <TextField
            label="Fecha de nacimiento"
            type="date"
            value={form.fechaNacimiento}
            onChange={(e) =>
              setForm({ ...form, fechaNacimiento: e.target.value })
            }
            slotProps={{ inputLabel: { shrink: true } }}
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

export default Cliente;
