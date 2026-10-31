// Simula un registro externo de titulares.
// Clave: patente. Valor: documento del titular.
const TITULARES: Record<string, string> = {
    AB123CD: "30111222",
    AC456EF: "32444555",
    AD789GH: "35666777",
    AH321JK: "35123456",
    AF999ZZ: "35123456",
};

export function verificarTitularidad(
    patente: string,
    documento: string,
): boolean {
    const patenteNormalizada = patente.trim().toUpperCase();
    const documentoNormalizado = documento.replace(/[.\s-]/g, "");

    return TITULARES[patenteNormalizada] === documentoNormalizado;
}
