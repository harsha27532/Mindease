package com.mindease.backend.controller;

import com.mindease.backend.config.JwtUtil;
import com.mindease.backend.dto.LoginRequest;
import com.mindease.backend.dto.RegisterRequest;
import com.mindease.backend.entity.ListenerProfile;
import com.mindease.backend.entity.Role;
import com.mindease.backend.entity.User;
import com.mindease.backend.repository.ListenerProfileRepository;
import com.mindease.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final ListenerProfileRepository listenerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(
            UserRepository userRepository,
            ListenerProfileRepository listenerProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.listenerProfileRepository = listenerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        if (request.name() == null || request.name().isBlank()
                || request.email() == null || request.email().isBlank()
                || request.password() == null
                || request.password().length() < 8
                || request.role() == null) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Enter a name, email, role and password of at least 8 characters.")
            );
        }

        String email = request.email().trim().toLowerCase();
        String roleStr = request.role().trim().toUpperCase();

        if (!Set.of("STUDENT", "LISTENER").contains(roleStr)) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Role must be STUDENT or LISTENER.")
            );
        }

        Role role;
        try {
            role = Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Invalid role specified.")
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
        user.setActive(true);

        User savedUser = userRepository.save(user);

        // If listener, automatically create initial listener profile
        if (role == Role.LISTENER) {
            ListenerProfile profile = new ListenerProfile();
            profile.setUser(savedUser);
            profile.setDisplayName(savedUser.getName());
            profile.setAvatar("🌱");
            profile.setBio("Passionate about peer support and active listening.");
            profile.setInterests("General Wellness, Academic Balance");
            profile.setAvailable(true);
            profile.setApprovalStatus("APPROVED");
            listenerProfileRepository.save(profile);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(
            Map.of(
                "message", "Registration successful.",
                "id", savedUser.getId(),
                "name", savedUser.getName(),
                "email", savedUser.getEmail(),
                "role", savedUser.getRole().name()
            )
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        if (request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Email and password are required.")
            );
        }

        return userRepository
            .findByEmail(request.email().trim().toLowerCase())
            .filter(user -> passwordEncoder.matches(request.password(), user.getPassword()))
            .<ResponseEntity<?>>map(user -> {
                if (!user.isActive()) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        Map.of("message", "This account has been deactivated. Please contact an administrator.")
                    );
                }

                String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

                return ResponseEntity.ok(Map.of(
                    "message", "Login successful.",
                    "token", token,
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole().name()
                ));
            })
            .orElseGet(() ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid email or password.")
                )
            );
    }
}
