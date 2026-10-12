package com.unla.grupol.rentar.rentar_dssd.config;

import com.unla.grupol.rentar.rentar_dssd.security.JwtAccessDeniedHandler;
import com.unla.grupol.rentar.rentar_dssd.security.JwtAuthenticationEntryPoint;
import com.unla.grupol.rentar.rentar_dssd.security.JwtAuthenticationFilter;
import com.unla.grupol.rentar.rentar_dssd.services.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;
    private final UsuarioService usuarioService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        // Rutas públicas de autenticación y salud
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()

                        // GraphQL (consultas públicas de catálogo/disponibilidad; autenticadas para historial)
                        .requestMatchers("/graphql/**", "/graphiql/**").permitAll()

                        // Flota de vehículos: lectura pública (catálogo para clientes y visitantes)
                        .requestMatchers(HttpMethod.GET, "/api/vehiculos/**").permitAll()
                        // Modificaciones de vehículos: exclusivo ADMINISTRADOR
                        .requestMatchers("/api/vehiculos/**").hasRole("ADMINISTRADOR")

                        // Gestión de clientes: exclusivo ADMINISTRADOR
                        .requestMatchers("/api/clientes/**").hasRole("ADMINISTRADOR")

                        // Reservas:
                        // Creación: exclusivo CLIENTE
                        .requestMatchers(HttpMethod.POST, "/api/reservas/**").hasRole("CLIENTE")
                        // Cancelación y consulta: CLIENTE o ADMINISTRADOR
                        .requestMatchers(HttpMethod.PATCH, "/api/reservas/*/cancelar").hasAnyRole("CLIENTE", "ADMINISTRADOR")
                        .requestMatchers(HttpMethod.GET, "/api/reservas/**").hasAnyRole("CLIENTE", "ADMINISTRADOR")

                        // Cualquier otra petición requiere autenticación
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(usuarioService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
