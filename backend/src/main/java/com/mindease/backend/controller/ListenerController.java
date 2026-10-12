package com.mindease.backend.controller;

import com.mindease.backend.config.JwtUtil;
import com.mindease.backend.service.ListenerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ListenerController {

    private final ListenerService listenerService;
    private final JwtUtil jwtUtil;

    public ListenerController(ListenerService listenerService, JwtUtil jwtUtil) {
        this.listenerService = listenerService;
        this.jwtUtil = jwtUtil;
    }

    private String resolveEmail(String queryEmail, String authHeader) {
        if (queryEmail != null && !queryEmail.isBlank()) {
            return queryEmail.trim().toLowerCase();
        }
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                return jwtUtil.extractEmail(token).toLowerCase();
            }
        }
        return null;
    }

    @GetMapping("/listener/profile")
    public ResponseEntity<?> getProfile(
            @RequestParam(required = false) String email,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String resolved = resolveEmail(email, authHeader);
        if (resolved == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User email or auth token is required."));
        }
        try {
            return ResponseEntity.ok(listenerService.getProfile(resolved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/listener/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String email = resolveEmail(body.get("email"), authHeader);
        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User email or auth token is required."));
        }
        try {
            return ResponseEntity.ok(listenerService.updateProfile(
                    email,
                    body.get("displayName"),
                    body.get("avatar"),
                    body.get("bio"),
                    body.get("interests")
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/listener/availability")
    public ResponseEntity<?> setAvailability(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String email = resolveEmail((String) body.get("email"), authHeader);
        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User email or auth token is required."));
        }
        boolean available = Boolean.parseBoolean(String.valueOf(body.getOrDefault("available", "true")));
        try {
            return ResponseEntity.ok(listenerService.setAvailability(email, available));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/listener/requests")
    public ResponseEntity<?> getRequests(
            @RequestParam(required = false) String email,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String resolved = resolveEmail(email, authHeader);
        if (resolved == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User email or auth token is required."));
        }
        return ResponseEntity.ok(listenerService.getRequestsForListener(resolved));
    }

    @PutMapping("/listener/requests/{id}/status")
    public ResponseEntity<?> updateRequestStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String email = resolveEmail(body.get("email"), authHeader);
        String status = body.get("status");
        if (email == null || status == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Listener email and new status are required."));
        }
        try {
            return ResponseEntity.ok(listenerService.updateRequestStatus(id, email, status));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/listener/requests/{id}/respond")
    public ResponseEntity<?> respondToRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String email = resolveEmail(body.get("email"), authHeader);
        String reply = body.get("responseMessage");
        if (email == null || reply == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Listener email and response message are required."));
        }
        try {
            return ResponseEntity.ok(listenerService.respondToRequest(id, email, reply));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/listeners/available")
    public ResponseEntity<?> getAvailableListeners() {
        return ResponseEntity.ok(listenerService.getAvailableListenersForStudents());
    }

    @PostMapping("/requests")
    public ResponseEntity<?> createSupportRequest(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String studentEmail = resolveEmail((String) body.get("studentEmail"), authHeader);
        Long listenerId = Long.valueOf(String.valueOf(body.get("listenerId")));
        String topic = (String) body.get("topic");
        String message = (String) body.get("message");

        if (studentEmail == null || listenerId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Student email and listener ID are required."));
        }

        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    listenerService.createStudentSupportRequest(studentEmail, listenerId, topic, message)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
