package com.mindease.backend.service;

import com.mindease.backend.entity.*;
import com.mindease.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ListenerService {

    private final UserRepository userRepository;
    private final ListenerProfileRepository listenerProfileRepository;
    private final SupportRequestRepository supportRequestRepository;

    public ListenerService(
            UserRepository userRepository,
            ListenerProfileRepository listenerProfileRepository,
            SupportRequestRepository supportRequestRepository) {
        this.userRepository = userRepository;
        this.listenerProfileRepository = listenerProfileRepository;
        this.supportRequestRepository = supportRequestRepository;
    }

    public Map<String, Object> getProfile(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        ListenerProfile profile = listenerProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    ListenerProfile newProf = new ListenerProfile();
                    newProf.setUser(user);
                    newProf.setDisplayName(user.getName());
                    newProf.setAvatar("🌿");
                    newProf.setBio("Dedicated peer listener.");
                    newProf.setInterests("General Wellness");
                    newProf.setAvailable(true);
                    newProf.setApprovalStatus("APPROVED");
                    return listenerProfileRepository.save(newProf);
                });

        Map<String, Object> res = new HashMap<>();
        res.put("id", profile.getId());
        res.put("userId", user.getId());
        res.put("email", user.getEmail());
        res.put("displayName", profile.getDisplayName());
        res.put("avatar", profile.getAvatar());
        res.put("bio", profile.getBio());
        res.put("interests", profile.getInterests());
        res.put("available", profile.isAvailable());
        res.put("approvalStatus", profile.getApprovalStatus());
        res.put("rejectionReason", profile.getRejectionReason());
        res.put("userActive", user.isActive());
        res.put("createdAt", profile.getCreatedAt());

        return res;
    }

    @Transactional
    public Map<String, Object> updateProfile(String email, String displayName, String avatar, String bio, String interests) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        ListenerProfile profile = listenerProfileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found for: " + email));

        if (displayName != null && !displayName.isBlank()) {
            profile.setDisplayName(displayName.trim());
        }
        if (avatar != null && !avatar.isBlank()) {
            profile.setAvatar(avatar.trim());
        }
        if (bio != null) {
            profile.setBio(bio.trim());
        }
        if (interests != null) {
            profile.setInterests(interests.trim());
        }

        ListenerProfile saved = listenerProfileRepository.save(profile);

        Map<String, Object> res = new HashMap<>();
        res.put("id", saved.getId());
        res.put("displayName", saved.getDisplayName());
        res.put("avatar", saved.getAvatar());
        res.put("bio", saved.getBio());
        res.put("interests", saved.getInterests());
        res.put("available", saved.isAvailable());
        res.put("message", "Profile updated successfully.");
        return res;
    }

    @Transactional
    public Map<String, Object> setAvailability(String email, boolean available) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        ListenerProfile profile = listenerProfileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found for: " + email));

        // If not approved, cannot set to available
        if (available && !"APPROVED".equalsIgnoreCase(profile.getApprovalStatus())) {
            throw new IllegalStateException("Your listener application must be approved by an administrator before becoming available.");
        }

        profile.setAvailable(available);
        ListenerProfile saved = listenerProfileRepository.save(profile);

        return Map.of(
            "id", saved.getId(),
            "available", saved.isAvailable(),
            "message", "Availability updated to: " + (saved.isAvailable() ? "Available" : "Unavailable")
        );
    }

    public List<Map<String, Object>> getRequestsForListener(String email) {
        List<SupportRequest> requests = supportRequestRepository.findByListener_EmailOrderByCreatedAtDesc(email.toLowerCase());
        List<Map<String, Object>> result = new ArrayList<>();

        for (SupportRequest r : requests) {
            Map<String, Object> reqMap = new HashMap<>();
            reqMap.put("id", r.getId());
            reqMap.put("studentName", r.getStudent().getName());
            reqMap.put("studentEmail", r.getStudent().getEmail());
            reqMap.put("topic", r.getTopic());
            reqMap.put("message", r.getMessage());
            reqMap.put("responseMessage", r.getResponseMessage());
            reqMap.put("status", r.getStatus().name());
            reqMap.put("createdAt", r.getCreatedAt());
            reqMap.put("updatedAt", r.getUpdatedAt());
            result.add(reqMap);
        }

        return result;
    }

    @Transactional
    public Map<String, Object> updateRequestStatus(Long requestId, String listenerEmail, String statusStr) {
        SupportRequest request = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Support request not found with id: " + requestId));

        if (!request.getListener().getEmail().equalsIgnoreCase(listenerEmail)) {
            throw new SecurityException("You are not authorized to modify this support request.");
        }

        RequestStatus status = RequestStatus.valueOf(statusStr.toUpperCase());
        request.setStatus(status);
        request.setUpdatedAt(LocalDateTime.now());
        SupportRequest saved = supportRequestRepository.save(request);

        return Map.of(
            "id", saved.getId(),
            "status", saved.getStatus().name(),
            "message", "Request marked as " + saved.getStatus().name()
        );
    }

    @Transactional
    public Map<String, Object> respondToRequest(Long requestId, String listenerEmail, String reply) {
        SupportRequest request = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Support request not found with id: " + requestId));

        if (!request.getListener().getEmail().equalsIgnoreCase(listenerEmail)) {
            throw new SecurityException("You are not authorized to respond to this support request.");
        }

        if (reply == null || reply.isBlank()) {
            throw new IllegalArgumentException("Response message cannot be empty.");
        }

        request.setResponseMessage(reply.trim());
        request.setStatus(RequestStatus.ACCEPTED);
        request.setUpdatedAt(LocalDateTime.now());
        SupportRequest saved = supportRequestRepository.save(request);

        return Map.of(
            "id", saved.getId(),
            "responseMessage", saved.getResponseMessage(),
            "status", saved.getStatus().name(),
            "message", "Reply sent successfully."
        );
    }

    public List<Map<String, Object>> getAvailableListenersForStudents() {
        List<ListenerProfile> profiles = listenerProfileRepository.findAll();
        List<Map<String, Object>> list = new ArrayList<>();

        for (ListenerProfile p : profiles) {
            if (p.isAvailable() && "APPROVED".equalsIgnoreCase(p.getApprovalStatus()) && p.getUser().isActive()) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", p.getId());
                map.put("name", p.getDisplayName());
                map.put("avatar", p.getAvatar());
                map.put("bio", p.getBio());
                map.put("interests", p.getInterests());
                map.put("available", true);
                list.add(map);
            }
        }

        return list;
    }

    @Transactional
    public Map<String, Object> createStudentSupportRequest(String studentEmail, Long listenerProfileId, String topic, String message) {
        User student = userRepository.findByEmail(studentEmail.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Student not found with email: " + studentEmail));

        ListenerProfile profile = listenerProfileRepository.findById(listenerProfileId)
                .orElseThrow(() -> new IllegalArgumentException("Listener profile not found with id: " + listenerProfileId));

        SupportRequest request = new SupportRequest();
        request.setStudent(student);
        request.setListener(profile.getUser());
        request.setTopic(topic != null && !topic.isBlank() ? topic.trim() : "General Support");
        request.setMessage(message != null ? message.trim() : "");
        request.setStatus(RequestStatus.PENDING);
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        SupportRequest saved = supportRequestRepository.save(request);

        return Map.of(
            "id", saved.getId(),
            "listenerName", profile.getDisplayName(),
            "topic", saved.getTopic(),
            "status", saved.getStatus().name(),
            "message", "Your support request has been sent to " + profile.getDisplayName()
        );
    }
}
