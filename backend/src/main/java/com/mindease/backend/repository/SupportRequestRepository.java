package com.mindease.backend.repository;

import com.mindease.backend.entity.RequestStatus;
import com.mindease.backend.entity.SupportRequest;
import com.mindease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportRequestRepository extends JpaRepository<SupportRequest, Long> {
    List<SupportRequest> findByListenerOrderByCreatedAtDesc(User listener);
    List<SupportRequest> findByListener_EmailOrderByCreatedAtDesc(String email);
    List<SupportRequest> findByStudentOrderByCreatedAtDesc(User student);
    List<SupportRequest> findByStudent_EmailOrderByCreatedAtDesc(String email);
    long countByStatus(RequestStatus status);
    List<SupportRequest> findTop10ByOrderByCreatedAtDesc();
}
