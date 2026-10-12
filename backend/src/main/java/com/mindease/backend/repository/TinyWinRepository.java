package com.mindease.backend.repository;

import com.mindease.backend.entity.TinyWin;
import com.mindease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TinyWinRepository extends JpaRepository<TinyWin, Long> {
    List<TinyWin> findByUserOrderByCreatedAtDesc(User user);
    List<TinyWin> findByUser_EmailOrderByCreatedAtDesc(String email);
    long count();
}
