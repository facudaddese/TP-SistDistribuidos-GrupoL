import { gql } from "@apollo/client";

export const CONSULTAR_DISPONIBILIDAD = gql`
  query consultarDisponibilidad(
    $tipo: String
    $marca: String
    $modelo: String
    $precioMin: Int
    $precioMax: Int
    $fechaInicio: String!
    $fechaFin: String!
  ) {
    consultarDisponibilidad(
      tipo: $tipo
      marca: $marca
      modelo: $modelo
      precioMin: $precioMin
      precioMax: $precioMax
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
    ) {
      id # <--- Clave para el map() y la caché de Apollo
      marca
      modelo
      anio
      patente
      color
      tipo
      precio
    }
  }
`;

export const CONSULTAR_RESERVAS = gql`
  query consultarReservas(
    $clienteId: ID
    $vehiculoId: ID
    $tipo: String
    $estado: String
    $fechaInicio: String
    $fechaFin: String
  ) {
    consultarReservas(
      clienteId: $clienteId
      vehiculoId: $vehiculoId
      tipo: $tipo
      estado: $estado
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
    ) {
      id
      fechaInicio
      fechaFin
      precioDiario
      importeTotal
      estado
      cliente {
        nombre
        apellido
        documento
      }
      vehiculo {
        marca
        modelo
        anio
        patente
        tipo
      }
    }
  }
`;

export const HISTORIAL_ALQUILERES = gql`
  query historialAlquileres($documento: Int!) {
    historialAlquileres(documento: $documento) {
      id
      fechaInicio # <--- Corregido el typo (tenía fechInicio)
      fechaFin
      cantDias
      importeTotal
      estado
      vehiculo {
        marca
        modelo
        anio
        patente
        tipo
      }
    }
  }
`;
