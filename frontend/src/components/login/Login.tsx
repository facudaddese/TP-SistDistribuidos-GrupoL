import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../api/httpClient";

const inputStyles = {
  "& .MuiInputLabel-root": { color: "#9ca3af" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
  "& .MuiOutlinedInput-root": {
    color: "#f3f4f6",
    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
    "&:hover fieldset": { borderColor: "#3b82f6" },
    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
    "& .MuiSvgIcon-root": { color: "#9ca3af" },
  },
};

const Login = () => {
  const { login, isAuthenticated, rol } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper para resolver a dónde mandar al usuario según su rol y la ruta de origen (from)
  const resolverRutaDestino = (userRol: string, fromPath?: string) => {
    const rolUpper = (userRol || "").toUpperCase();
    const isAdmin = rolUpper === "ADMINISTRADOR" || rolUpper === "ADMIN";

    // Si viene de /unauthorized o /login o no hay ruta previa, redirigir al panel por defecto
    if (!fromPath || fromPath === "/unauthorized" || fromPath === "/login") {
      return isAdmin ? "/admin/vehiculos" : "/reservar";
    }

    // Validar si un cliente intenta entrar a una ruta de admin
    if (
      !isAdmin &&
      (fromPath.startsWith("/admin") || fromPath === "/clientes")
    ) {
      return "/reservar";
    }

    // Validar si un admin intenta entrar a una ruta exclusiva de cliente
    if (
      isAdmin &&
      (fromPath === "/historial-alquileres" || fromPath === "/reservar")
    ) {
      return "/admin/vehiculos";
    }

    return fromPath;
  };

  // Si ya está autenticado
  if (isAuthenticated && rol) {
    const from = (location.state as { from?: { pathname: string } })?.from
      ?.pathname;
    return <Navigate to={resolverRutaDestino(rol, from)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrim = email.trim();
    if (!emailTrim || !password) {
      setError("Por favor, completá tu email y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const authUser = await login({ email: emailTrim, password });

      const from = (location.state as { from?: { pathname: string } })?.from
        ?.pathname;
      const destino = resolverRutaDestino(authUser.rol, from);

      navigate(destino, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.message || "Credenciales incorrectas o usuario no habilitado.",
        );
      } else {
        setError(
          "Error al comunicarse con el servidor. Verificá que el backend esté activo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError(null);
  };

  return (
    <main className="flex items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-md bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl text-white">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-white tracking-wide">
            Iniciar Sesión
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Ingresá tus credenciales para acceder a Rentar
          </p>
        </div>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, bgcolor: "rgba(239, 68, 68, 0.15)", color: "#fca5a5" }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
            sx={inputStyles}
          />

          <TextField
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            sx={inputStyles}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="mostrar u ocultar contraseña"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "#9ca3af" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              mt: 1,
              py: 1.4,
              fontWeight: 600,
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
            }}
          >
            {loading ? "Verificando credenciales..." : "Entrar"}
          </Button>
        </form>

        <Box
          sx={{ mt: 4, pt: 3, borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 text-center">
            Credenciales de prueba (desarrollo):
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill("admin@rentar.com", "admin123")}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-left transition-colors"
            >
              <div className="font-bold text-blue-400">ADMINISTRADOR</div>
              <div className="text-gray-300">admin@rentar.com</div>
              <div className="text-gray-500">clave: admin123</div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickFill("cliente@rentar.com", "cliente123")
              }
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-left transition-colors"
            >
              <div className="font-bold text-green-400">CLIENTE</div>
              <div className="text-gray-300">cliente@rentar.com</div>
              <div className="text-gray-500">clave: cliente123</div>
            </button>
          </div>
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() =>
                handleQuickFill("inactivo@rentar.com", "inactivo123")
              }
              className="text-[11px] text-gray-400 hover:text-red-300 underline"
            >
              Probar usuario inactivo (inactivo@rentar.com)
            </button>
          </div>
        </Box>
      </div>
    </main>
  );
};

export default Login;
