package com.unla.grupol.rentar.rentar_dssd.entities;

import com.unla.grupol.rentar.rentar_dssd.entities.enums.Rol;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "administrador")
@PrimaryKeyJoinColumn(name = "usuario_id")
@DiscriminatorValue("ADMINISTRADOR")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Administrador extends Usuario {

    @Column(length = 30)
    private String legajo;

    @Override
    public Rol getRol() {
        return Rol.ADMINISTRADOR;
    }
}
