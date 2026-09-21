package com.unla.grupol.rentar.rentar_dssd.repositories;

import com.unla.grupol.rentar.rentar_dssd.entities.Reserva;
import com.unla.grupol.rentar.rentar_dssd.entities.enums.EstadoReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    @Query("SELECT COUNT(r) > 0 FROM Reserva r WHERE r.vehiculo.id = :vehiculoId AND r.estado = :estado AND (r.fechaHoraInicio < :fin AND r.fechaHoraFin > :inicio)")
    boolean existsOverlappingReserva(@Param("vehiculoId") Long vehiculoId, @Param("estado") EstadoReserva estado, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
}
