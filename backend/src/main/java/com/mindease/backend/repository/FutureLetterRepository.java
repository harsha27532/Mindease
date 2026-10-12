package com.mindease.backend.repository;

import com.mindease.backend.entity.FutureLetter;
import com.mindease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FutureLetterRepository extends JpaRepository<FutureLetter, Long> {
    List<FutureLetter> findByUserOrderByCreatedAtDesc(User user);
    List<FutureLetter> findByUser_EmailOrderByCreatedAtDesc(String email);
    long count();
}
