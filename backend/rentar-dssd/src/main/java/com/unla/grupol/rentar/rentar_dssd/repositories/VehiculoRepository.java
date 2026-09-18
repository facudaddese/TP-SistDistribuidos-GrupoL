package com.unla.grupol.rentar.rentar_dssd.repositories;

import com.unla.grupol.rentar.rentar_dssd.entities.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {
    Optional<Vehiculo> findByPatente(String patente);
    boolean existsByPatente(String patente);
}
