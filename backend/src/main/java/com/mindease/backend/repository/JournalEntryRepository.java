package com.mindease.backend.repository;

import com.mindease.backend.entity.JournalEntry;
import com.mindease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {
    List<JournalEntry> findByUserOrderByCreatedAtDesc(User user);
    List<JournalEntry> findByUser_EmailOrderByCreatedAtDesc(String email);
    long count();
}
