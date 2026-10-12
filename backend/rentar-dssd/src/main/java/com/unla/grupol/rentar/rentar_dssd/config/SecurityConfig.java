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
            .accessDeniedHandler(jwtAccessDeniedHandler))
        .authorizeHttpRequests(auth -> auth
            // Documentació pública (Swagger / OpenAPI)
            .requestMatchers(
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html")
            .permitAll()

            // Rutes públiques d'autenticació i salut
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/actuator/**").permitAll()

            // GraphQL (consultes públiques de catàleg/disponibilitat; autenticades per a
            // historial)
            .requestMatchers("/graphql/**", "/graphiql/**").permitAll()

            // Flota de vehicles: lectura pública (catàleg per a clients i visitants)
            .requestMatchers(HttpMethod.GET, "/api/vehiculos/**").permitAll()
            // Modificacions de vehicles: exclusiu ADMINISTRADOR
            .requestMatchers("/api/vehiculos/**").hasRole("ADMINISTRADOR")

            // Gestió de clients: exclusiu ADMINISTRADOR
            .requestMatchers("/api/clientes/**").hasRole("ADMINISTRADOR")

            // Reserves:
            // Creació: exclusiu CLIENTE
            .requestMatchers(HttpMethod.POST, "/api/reservas/**").hasRole("CLIENTE")
            // Cancel·lació i consulta: CLIENTE o ADMINISTRADOR
            .requestMatchers(HttpMethod.PATCH, "/api/reservas/*/cancelar").hasAnyRole("CLIENTE", "ADMINISTRADOR")
            .requestMatchers(HttpMethod.GET, "/api/reservas/**").hasAnyRole("CLIENTE", "ADMINISTRADOR")

            // Qualsevol altra petició requereix autenticació
            .anyRequest().authenticated())
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