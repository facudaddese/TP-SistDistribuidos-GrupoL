package com.unla.grupol.rentar.rentar_dssd.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Se deshabilita CSRF para poder probar desde Postman
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll() // Se permiten todas las peticiones temporalmente para desarrollo
            );
        
        return http.build();
    }
}
