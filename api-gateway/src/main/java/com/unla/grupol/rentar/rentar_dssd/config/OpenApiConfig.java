package com.unla.grupol.rentar.rentar_dssd.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI customOpenAPI() {
    return new OpenAPI()
        .info(new Info()
            .title("API REST - Rentar")
            .version("1.0")
            .description(
                "Documentación interactiva de los endpoints REST expuestos para la gestión del sistema Rentar.")
            .contact(new Contact()
                .name("Grupo L - DSSD")));
  }
}