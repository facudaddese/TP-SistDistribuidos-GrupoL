import { gql } from "@apollo/client";

export const CONSULTAR_DISPONIBILIDAD = gql`
  query consultarDisponibilidad(
    $tipo: TipoVehiculo
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
      id
      marca
      modelo
      anio
      patente
      color
      tipo
      precioDiario
    }
  }
`;

export const CONSULTAR_RESERVAS = gql`
  query consultarReservas(
    $clienteId: ID
    $vehiculoId: ID
    $tipo: TipoVehiculo
    $estado: EstadoReserva
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
  query historialAlquileres($documento: String!) {
    historialAlquileres(documento: $documento) {
      id
      fechaInicio
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

export const OBTENER_TODOS_LOS_VEHICULOS = gql`
  query obtenerTodosLosVehiculos {
    obtenerTodosLosVehiculos {
      id
      marca
      modelo
      anio
      tipo
      precioDiario
      patente
      color
    }
  }
`;
