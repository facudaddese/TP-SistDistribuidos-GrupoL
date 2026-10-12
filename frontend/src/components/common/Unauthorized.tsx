import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Unauthorized = () => {
  const { rol } = useAuth();

  const destino = rol === "ADMINISTRADOR" ? "/admin/vehiculos" : "/";

  return (
    <main className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-md w-full bg-black/60 backdrop-blur-md border border-red-500/30 rounded-2xl p-8 text-center text-white shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-3xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-red-400 mb-2">Acceso Denegado</h2>
        <p className="text-gray-300 text-sm mb-6">
          No contás con los permisos necesarios para acceder a esta sección con tu rol actual ({rol || "SIN ROL"}).
        </p>
        <Link
          to={destino}
          className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-md"
        >
          Volver a mi panel principal
        </Link>
      </div>
    </main>
  );
};

export default Unauthorized;
