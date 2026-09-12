import { gql } from "@apollo/client";

export const CONSULTAR_DISPONIBILIDAD = gql`
  query consultarDisponibilidad(
    $tipo: String
    $marca: String
    $modelo: String
    $precioMin: Float
    $precioMax: Float
    $fechaInicio: String!
    $fechaFin: String!
  ) {
    vehiculosDisponibles(
      tipo: $tipo
      marca: $marca
      modelo: $modelo
      precioMin: $precioMin
      precioMax: $precioMax
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
    ) {
      id
      marca
      modelo
      anio
      tipo
      precioDiario
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
      id
      fechaInicio
      fechaFin
      precioDiario
      importeTotal
      estado
    }
  }
`;

export const HISTORIAL_ALQUILERES = gql`
  query historialAlquileres($documento: Int!) {
    historialAlquileres(documento: $documento) {
      vehiculo {
        marca
        modelo
        anio
        patente
        tipo
      }
        id
      fechInicio
      fechaFin
      cantDias
      importeTotal
      estado
    }
  }
`;
