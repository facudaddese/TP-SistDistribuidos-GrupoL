package com.unla.grupol.rentar.rentar_dssd.services;

import com.unla.grupol.rentar.rentar_dssd.dtos.auth.UsuarioResponseDTO;
import com.unla.grupol.rentar.rentar_dssd.entities.Administrador;
import com.unla.grupol.rentar.rentar_dssd.entities.Cliente;
import com.unla.grupol.rentar.rentar_dssd.entities.Usuario;
import com.unla.grupol.rentar.rentar_dssd.exceptions.RecursoNoEncontradoException;
import com.unla.grupol.rentar.rentar_dssd.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No se encontró usuario con email: " + email));
    }

    @Transactional(readOnly = true)
    public Usuario buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró usuario con email: " + email));
    }

    @Transactional(readOnly = true)
    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró usuario con ID: " + id));
    }

    public String obtenerNombreCompleto(Usuario usuario) {
        if (usuario instanceof Cliente cliente) {
            return cliente.getNombre() + " " + cliente.getApellido();
        } else if (usuario instanceof Administrador admin) {
            return (admin.getLegajo() != null && !admin.getLegajo().isBlank())
                    ? "Admin (" + admin.getLegajo() + ")"
                    : "Administrador";
        }
        return usuario.getEmail();
    }

    public UsuarioResponseDTO convertirAResponse(Usuario usuario) {
        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getRol().name(),
                obtenerNombreCompleto(usuario),
                usuario.isActivo()
        );
    }
}
