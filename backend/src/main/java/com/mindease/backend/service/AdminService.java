package com.mindease.backend.service;

import com.mindease.backend.entity.*;
import com.mindease.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ListenerProfileRepository listenerProfileRepository;
    private final SupportRequestRepository supportRequestRepository;
    private final MoodEntryRepository moodEntryRepository;
    private final TinyWinRepository tinyWinRepository;

    public AdminService(
            UserRepository userRepository,
            ListenerProfileRepository listenerProfileRepository,
            SupportRequestRepository supportRequestRepository,
            MoodEntryRepository moodEntryRepository,
            TinyWinRepository tinyWinRepository) {
        this.userRepository = userRepository;
        this.listenerProfileRepository = listenerProfileRepository;
        this.supportRequestRepository = supportRequestRepository;
        this.moodEntryRepository = moodEntryRepository;
        this.tinyWinRepository = tinyWinRepository;
    }

    public Map<String, Object> getPlatformStats() {
        long totalUsers = userRepository.count();
        long studentCount = userRepository.countByRole(Role.STUDENT);
        long listenerCount = userRepository.countByRole(Role.LISTENER);
        long activeListeners = listenerProfileRepository.countByAvailableTrue();
        long pendingApplications = listenerProfileRepository.countByApprovalStatus("PENDING");

        long totalRequests = supportRequestRepository.count();
        long pendingRequests = supportRequestRepository.countByStatus(RequestStatus.PENDING);
        long acceptedRequests = supportRequestRepository.countByStatus(RequestStatus.ACCEPTED);
        long completedSessions = supportRequestRepository.countByStatus(RequestStatus.COMPLETED);

        long totalMoodEntries = moodEntryRepository.count();
        long totalTinyWins = tinyWinRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("studentCount", studentCount);
        stats.put("listenerCount", listenerCount);
        stats.put("activeListeners", activeListeners);
        stats.put("pendingApplications", pendingApplications);
        stats.put("totalRequests", totalRequests);
        stats.put("pendingRequests", pendingRequests);
        stats.put("acceptedRequests", acceptedRequests);
        stats.put("completedSessions", completedSessions);
        stats.put("totalMoodEntries", totalMoodEntries);
        stats.put("totalTinyWins", totalTinyWins);
        stats.put("systemStatus", "OPERATIONAL");

        return stats;
    }

    public Map<String, Object> getUsers(String query, String roleStr, String statusStr, int page, int size) {
        Role role = null;
        if (roleStr != null && !roleStr.isBlank() && !roleStr.equalsIgnoreCase("ALL")) {
            try {
                role = Role.valueOf(roleStr.toUpperCase());
            } catch (Exception ignored) {}
        }

        Boolean active = null;
        if (statusStr != null && !statusStr.isBlank() && !statusStr.equalsIgnoreCase("ALL")) {
            if (statusStr.equalsIgnoreCase("ACTIVE")) active = true;
            else if (statusStr.equalsIgnoreCase("INACTIVE")) active = false;
        }

        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage = userRepository.searchUsers(role, active, (query != null && !query.isBlank()) ? query.trim() : null, pageRequest);

        List<Map<String, Object>> userList = new ArrayList<>();
        for (User u : userPage.getContent()) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", u.getId());
            userMap.put("name", u.getName());
            userMap.put("email", u.getEmail());
            userMap.put("role", u.getRole().name());
            userMap.put("active", u.isActive());
            userMap.put("createdAt", u.getCreatedAt());
            userList.add(userMap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("users", userList);
        response.put("currentPage", userPage.getNumber());
        response.put("totalPages", userPage.getTotalPages());
        response.put("totalElements", userPage.getTotalElements());

        return response;
    }

    @Transactional
    public Map<String, Object> toggleUserStatus(Long userId, String callerEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        if (user.getEmail().equalsIgnoreCase(callerEmail)) {
            throw new IllegalStateException("Administrators cannot deactivate their own account.");
        }

        user.setActive(!user.isActive());
        User updated = userRepository.save(user);

        return Map.of(
            "id", updated.getId(),
            "name", updated.getName(),
            "email", updated.getEmail(),
            "active", updated.isActive(),
            "message", "User status updated to " + (updated.isActive() ? "Active" : "Inactive")
        );
    }

    public List<Map<String, Object>> getAllListeners() {
        List<ListenerProfile> profiles = listenerProfileRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();

        for (ListenerProfile p : profiles) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("userId", p.getUser().getId());
            map.put("name", p.getUser().getName());
            map.put("email", p.getUser().getEmail());
            map.put("displayName", p.getDisplayName());
            map.put("avatar", p.getAvatar());
            map.put("bio", p.getBio());
            map.put("interests", p.getInterests());
            map.put("available", p.isAvailable());
            map.put("approvalStatus", p.getApprovalStatus());
            map.put("rejectionReason", p.getRejectionReason());
            map.put("userActive", p.getUser().isActive());
            map.put("createdAt", p.getCreatedAt());
            result.add(map);
        }

        return result;
    }

    @Transactional
    public Map<String, Object> updateListenerApproval(Long profileId, String status, String reason) {
        ListenerProfile profile = listenerProfileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Listener profile not found with id: " + profileId));

        String normalized = status != null ? status.trim().toUpperCase() : "APPROVED";
        profile.setApprovalStatus(normalized);
        if ("REJECTED".equals(normalized)) {
            profile.setRejectionReason(reason != null ? reason.trim() : "Application did not meet criteria.");
            profile.setAvailable(false);
        } else if ("APPROVED".equals(normalized)) {
            profile.setRejectionReason(null);
        }

        ListenerProfile saved = listenerProfileRepository.save(profile);

        return Map.of(
            "id", saved.getId(),
            "displayName", saved.getDisplayName(),
            "approvalStatus", saved.getApprovalStatus(),
            "rejectionReason", saved.getRejectionReason() != null ? saved.getRejectionReason() : "",
            "message", "Listener application updated to " + saved.getApprovalStatus()
        );
    }

    public List<Map<String, Object>> getRecentActivity() {
        List<Map<String, Object>> activities = new ArrayList<>();

        // Recent users
        List<User> recentUsers = userRepository.findTop10ByOrderByCreatedAtDesc();
        for (User u : recentUsers) {
            Map<String, Object> act = new HashMap<>();
            act.put("id", "user-" + u.getId());
            act.put("type", "USER_REGISTRATION");
            act.put("description", "New " + u.getRole().name().toLowerCase() + " joined: " + u.getName());
            act.put("timestamp", u.getCreatedAt());
            act.put("badge", u.getRole().name());
            activities.add(act);
        }

        // Recent requests
        List<SupportRequest> recentRequests = supportRequestRepository.findTop10ByOrderByCreatedAtDesc();
        for (SupportRequest r : recentRequests) {
            Map<String, Object> act = new HashMap<>();
            act.put("id", "req-" + r.getId());
            act.put("type", "SUPPORT_REQUEST");
            act.put("description", "Support request on '" + r.getTopic() + "' (" + r.getStatus().name() + ")");
            act.put("timestamp", r.getCreatedAt());
            act.put("badge", r.getStatus().name());
            activities.add(act);
        }

        activities.sort((a, b) -> {
            java.time.LocalDateTime t1 = (java.time.LocalDateTime) a.get("timestamp");
            java.time.LocalDateTime t2 = (java.time.LocalDateTime) b.get("timestamp");
            return t2.compareTo(t1);
        });

        return activities.subList(0, Math.min(15, activities.size()));
    }
}
