package com.unla.grupol.rentar.rentar_dssd.config;

import com.unla.grupol.rentar.rentar_dssd.entities.Administrador;
import com.unla.grupol.rentar.rentar_dssd.entities.Cliente;
import com.unla.grupol.rentar.rentar_dssd.entities.Vehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoVehiculo;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.TipoVehiculo;
import com.unla.grupol.rentar.rentar_dssd.repositories.AdministradorRepository;
import com.unla.grupol.rentar.rentar_dssd.repositories.ClienteRepository;
import com.unla.grupol.rentar.rentar_dssd.repositories.UsuarioRepository;
import com.unla.grupol.rentar.rentar_dssd.repositories.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final AdministradorRepository administradorRepository;
    private final ClienteRepository clienteRepository;
    private final VehiculoRepository vehiculoRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        inicializarUsuarios();
        inicializarVehiculos();
    }

    private void inicializarUsuarios() {
        // 1. Administrador de desarrollo
        if (!usuarioRepository.existsByEmail("admin@rentar.com")) {
            Administrador admin = Administrador.builder()
                    .email("admin@rentar.com")
                    .password(passwordEncoder.encode("admin123"))
                    .legajo("ADM-001")
                    .activo(true)
                    .build();
            administradorRepository.save(admin);
            log.info("Usuario Administrador inicial creado: admin@rentar.com / admin123");
        }

        // 2. Cliente de desarrollo activo
        if (!usuarioRepository.existsByEmail("cliente@rentar.com")) {
            Cliente cliente = Cliente.builder()
                    .email("cliente@rentar.com")
                    .password(passwordEncoder.encode("cliente123"))
                    .documento("35123456")
                    .nombre("Juan")
                    .apellido("Pérez")
                    .telefono("1123456789")
                    .fechaNacimiento(LocalDate.of(1995, 5, 20))
                    .activo(true)
                    .build();
            clienteRepository.save(cliente);
            log.info("Usuario Cliente inicial creado: cliente@rentar.com / cliente123");
        }

        // 3. Cliente inactivo para verificación de rechazo de cuenta deshabilitada
        if (!usuarioRepository.existsByEmail("inactivo@rentar.com")) {
            Cliente inactivo = Cliente.builder()
                    .email("inactivo@rentar.com")
                    .password(passwordEncoder.encode("inactivo123"))
                    .documento("99999999")
                    .nombre("Usuario")
                    .apellido("Inactivo")
                    .telefono("1100000000")
                    .fechaNacimiento(LocalDate.of(2000, 1, 1))
                    .activo(false)
                    .build();
            clienteRepository.save(inactivo);
            log.info("Usuario Inactivo inicial creado: inactivo@rentar.com / inactivo123 (activo=false)");
        }
    }

    private void inicializarVehiculos() {
        if (vehiculoRepository.count() == 0) {
            Vehiculo v1 = Vehiculo.builder()
                    .patente("AE123AB")
                    .marca("Toyota")
                    .modelo("Corolla")
                    .anio(2023)
                    .color("Blanco")
                    .tipoVehiculo(TipoVehiculo.SEDAN)
                    .precioDiario(BigDecimal.valueOf(45000))
                    .estado(EstadoVehiculo.DISPONIBLE)
                    .activo(true)
                    .build();

            Vehiculo v2 = Vehiculo.builder()
                    .patente("AF456CD")
                    .marca("Ford")
                    .modelo("Ranger")
                    .anio(2024)
                    .color("Gris")
                    .tipoVehiculo(TipoVehiculo.PICKUP)
                    .precioDiario(BigDecimal.valueOf(75000))
                    .estado(EstadoVehiculo.DISPONIBLE)
                    .activo(true)
                    .build();

            Vehiculo v3 = Vehiculo.builder()
                    .patente("AG789EF")
                    .marca("Volkswagen")
                    .modelo("Taos")
                    .anio(2023)
                    .color("Azul")
                    .tipoVehiculo(TipoVehiculo.SUV)
                    .precioDiario(BigDecimal.valueOf(60000))
                    .estado(EstadoVehiculo.DISPONIBLE)
                    .activo(true)
                    .build();

            vehiculoRepository.save(v1);
            vehiculoRepository.save(v2);
            vehiculoRepository.save(v3);
            log.info("Vehículos iniciales de prueba creados.");
        }
    }
}
