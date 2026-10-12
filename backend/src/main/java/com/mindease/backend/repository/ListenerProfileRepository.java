package com.mindease.backend.repository;

import com.mindease.backend.entity.ListenerProfile;
import com.mindease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListenerProfileRepository extends JpaRepository<ListenerProfile, Long> {
    Optional<ListenerProfile> findByUser(User user);
    Optional<ListenerProfile> findByUser_Email(String email);
    Optional<ListenerProfile> findByUserId(Long userId);
    List<ListenerProfile> findByAvailableTrue();
    long countByAvailableTrue();
    long countByApprovalStatus(String approvalStatus);
    List<ListenerProfile> findAllByOrderByCreatedAtDesc();
}
