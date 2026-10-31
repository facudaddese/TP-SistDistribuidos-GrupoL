package com.unla.grupol.rentar.rentar_dssd.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    public static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Rentar API Gateway - Documentación REST")
                        .version("1.0.0")
                        .description("""
                                ### Arquitectura del Sistema
                                El sistema Rentar adopta un diseño distribuido basado en microservicios desacoplados:
                                **Frontend (React / Vite)** -> **API Gateway (Spring Boot 3 / WebMVC)** -> **gRPC (HTTP/2 - Protobuf)** -> **Microservicios de Dominio**
                                
                                - **Customer Service (puerto 50051)**: Gestión de clientes, validación de estado activo y datos maestros de identidad.
                                - **Vehicle Service (puerto 50052)**: Catálogo, especificaciones técnicas, control de flota y estados operativos (DISPONIBLE, RESERVADO, EN_ALQUILER).
                                - **Rental Service (puerto 50053)**: Gestión transaccional de reservas, control de calendarios y detección de solapamientos temporales.
                                
                                ### Autenticación y Autorización (JWT)
                                La mayoría de las operaciones administrativas y de alquiler requieren autenticación mediante JSON Web Tokens (JWT):
                                1. Obtenga su token enviando credenciales válidas al endpoint público **`POST /api/auth/login`**.
                                2. Copie el campo `token` recibido en la respuesta JSON.
                                3. Haga clic en el botón superior **Authorize** (ícono de candado) e ingrese el token (no es necesario escribir 'Bearer ', Swagger UI lo incluye automáticamente).
                                4. Los endpoints validarán los roles requeridos (**ADMINISTRADOR** o **CLIENTE**) según lo establecido en `SecurityConfig`.
                                """)
                        .contact(new Contact()
                                .name("Grupo L - DSSD")
                                .url("https://github.com/facudaddese/TP-SistDistribuidos-GrupoL")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Token JWT Bearer emitido por POST /api/auth/login")));
    }
}