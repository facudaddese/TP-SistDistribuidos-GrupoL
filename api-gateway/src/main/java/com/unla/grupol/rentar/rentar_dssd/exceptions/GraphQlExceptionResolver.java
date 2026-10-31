package com.unla.grupol.rentar.rentar_dssd.exceptions;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;

/**
 * Resolver de excepciones para GraphQL.
 * Mapea StatusRuntimeException a GraphQLError reutilizando el criterio del Bloque 2.0:
 * el detalle de depuración va únicamente a los logs y se devuelve un mensaje genérico.
 */
@Component
public class GraphQlExceptionResolver extends DataFetcherExceptionResolverAdapter {

    private static final Logger log = LoggerFactory.getLogger(GraphQlExceptionResolver.class);

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        if (ex instanceof StatusRuntimeException grpcEx) {
            Status status = grpcEx.getStatus();
            Status.Code code = status.getCode();
            String description = status.getDescription();

            log.error("Excepción gRPC capturada en GraphQL: código={}, descripción={}", code, description, grpcEx);

            ErrorType errorType;
            String mensajeRespuesta;

            switch (code) {
                case NOT_FOUND -> {
                    errorType = ErrorType.NOT_FOUND;
                    mensajeRespuesta = (description != null && !description.isBlank())
                            ? description
                            : "Recurso no encontrado";
                }
                case INVALID_ARGUMENT -> {
                    errorType = ErrorType.BAD_REQUEST;
                    mensajeRespuesta = (description != null && !description.isBlank())
                            ? description
                            : "Los datos enviados no son válidos";
                }
                case ALREADY_EXISTS -> {
                    errorType = ErrorType.BAD_REQUEST;
                    mensajeRespuesta = (description != null && !description.isBlank())
                            ? description
                            : "El recurso ya existe";
                }
                case FAILED_PRECONDITION -> {
                    errorType = ErrorType.BAD_REQUEST;
                    mensajeRespuesta = (description != null && !description.isBlank())
                            ? description
                            : "No se cumplen las precondiciones para la operación";
                }
                case UNAVAILABLE, DEADLINE_EXCEEDED -> {
                    errorType = ErrorType.INTERNAL_ERROR;
                    mensajeRespuesta = "Servicio temporalmente no disponible";
                }
                default -> {
                    errorType = ErrorType.INTERNAL_ERROR;
                    mensajeRespuesta = "Error interno del servidor";
                }
            }

            return GraphqlErrorBuilder.newError(env)
                    .errorType(errorType)
                    .message(mensajeRespuesta)
                    .build();
        }

        if (ex instanceof IllegalArgumentException || ex instanceof IllegalStateException) {
            log.error("Error de validación en GraphQL: {}", ex.getMessage());
            return GraphqlErrorBuilder.newError(env)
                    .errorType(ErrorType.BAD_REQUEST)
                    .message(ex.getMessage())
                    .build();
        }

        return null;
    }
}
