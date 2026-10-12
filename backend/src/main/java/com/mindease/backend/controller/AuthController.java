
package com.mindease.backend.controller;

import com.mindease.backend.dto.LoginRequest;
import com.mindease.backend.dto.RegisterRequest;
import com.mindease.backend.entity.User;
import com.mindease.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request) {

        if (request.name() == null || request.name().isBlank()
                || request.email() == null || request.email().isBlank()
                || request.password() == null
                || request.password().length() < 8
                || request.role() == null) {
            return ResponseEntity.badRequest().body(
                Map.of("message",
                    "Enter a name, email, role and password of at least 8 characters.")
            );
        }

        String email = request.email().trim().toLowerCase();
        String role = request.role().trim().toUpperCase();

        if (!Set.of("STUDENT", "LISTENER").contains(role)) {
            return ResponseEntity.badRequest().body(
                Map.of("message",
                    "Role must be STUDENT or LISTENER.")
            );
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of("message", "Email is already registered.")
            );
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(role);

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(
            Map.of(
                "message", "Registration successful.",
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole()
            )
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        if (request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Email and password are required.")
            );
        }

        return userRepository
            .findByEmail(request.email().trim().toLowerCase())
            .filter(user ->
                passwordEncoder.matches(
                    request.password(), user.getPassword()
                )
            )
            .<ResponseEntity<?>>map(user ->
                ResponseEntity.ok(Map.of(
                    "message", "Login successful.",
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole()
                ))
            )
            .orElseGet(() ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid email or password.")
                )
            );
    }
}

