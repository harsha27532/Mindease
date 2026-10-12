package com.mindease.backend.repository;

import com.mindease.backend.entity.MoodEntry;
import com.mindease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MoodEntryRepository extends JpaRepository<MoodEntry, Long> {
    List<MoodEntry> findByUserOrderByCreatedAtDesc(User user);
    List<MoodEntry> findByUser_EmailOrderByCreatedAtDesc(String email);
    long count();
}
