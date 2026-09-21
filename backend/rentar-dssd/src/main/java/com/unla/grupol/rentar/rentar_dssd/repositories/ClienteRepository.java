package com.unla.grupol.rentar.rentar_dssd.repositories;

import com.unla.grupol.rentar.rentar_dssd.entities.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByDocumento(String documento);

    Optional<Cliente> findByEmail(String email);

    boolean existsByDocumento(String documento);

    boolean existsByEmail(String email);

    List<Cliente> findAllByActivoTrue();
}
