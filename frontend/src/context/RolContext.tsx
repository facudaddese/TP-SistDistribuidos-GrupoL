
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// TODO: esto es un STAND-IN mientras no existe el login real.
// Cuando llegue el AuthContext de verdad, este archivo se borra y en
// NavBar / AdminRoute se reemplaza `useRol()` por el hook del AuthContext,
// que debería expresar el rol de la misma forma: "ADMINISTRADOR" | "CLIENTE".

export type Rol = "ADMINISTRADOR" | "CLIENTE";

interface RolContextValue {
  rol: Rol;
  setRol: (rol: Rol) => void;
}

const RolContext = createContext<RolContextValue | undefined>(undefined);

const STORAGE_KEY = "rol_prueba";

export const RolProvider = ({ children }: { children: ReactNode }) => {
  const [rol, setRolState] = useState<Rol>(
    () => (localStorage.getItem(STORAGE_KEY) as Rol) || "CLIENTE",
  );

  const setRol = (nuevo: Rol) => {
    localStorage.setItem(STORAGE_KEY, nuevo);
    setRolState(nuevo);
  };

  return (
    <RolContext.Provider value={{ rol, setRol }}>{children}</RolContext.Provider>
  );
};

export const useRol = () => {
  const ctx = useContext(RolContext);
  if (!ctx) throw new Error("useRol debe usarse dentro de <RolProvider>");
  return ctx;
};
