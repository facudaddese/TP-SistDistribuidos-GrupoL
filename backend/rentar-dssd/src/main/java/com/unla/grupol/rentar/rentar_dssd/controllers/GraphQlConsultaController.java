package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.dto.graphql.GraphQlVehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.TipoVehiculo;
import com.unla.grupol.rentar.rentar_dssd.services.GraphQlConsultaService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class GraphQlConsultaController {

    private final GraphQlConsultaService consultaService;

    public GraphQlConsultaController(
            GraphQlConsultaService consultaService
    ) {
        this.consultaService = consultaService;
    }

    @QueryMapping
    public List<GraphQlVehiculo> consultarDisponibilidad(
            @Argument TipoVehiculo tipo,
            @Argument String marca,
            @Argument String modelo,
            @Argument Integer precioMin,
            @Argument Integer precioMax,
            @Argument String fechaInicio,
            @Argument String fechaFin
    ) {
        return consultaService.consultarDisponibilidad(
                tipo,
                marca,
                modelo,
                precioMin,
                precioMax,
                fechaInicio,
                fechaFin
        );
    }
}
