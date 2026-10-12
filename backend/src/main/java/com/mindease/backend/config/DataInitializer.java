package com.mindease.backend.config;

import com.mindease.backend.entity.*;
import com.mindease.backend.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ListenerProfileRepository listenerProfileRepository;
    private final SupportRequestRepository supportRequestRepository;
    private final MoodEntryRepository moodEntryRepository;
    private final TinyWinRepository tinyWinRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${mindease.admin.email:admin@mindease.com}")
    private String adminEmail;

    @Value("${mindease.admin.password:Admin@12345}")
    private String adminPassword;

    @Value("${mindease.admin.name:MindEase Administrator}")
    private String adminName;

    public DataInitializer(
            UserRepository userRepository,
            ListenerProfileRepository listenerProfileRepository,
            SupportRequestRepository supportRequestRepository,
            MoodEntryRepository moodEntryRepository,
            TinyWinRepository tinyWinRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.listenerProfileRepository = listenerProfileRepository;
        this.supportRequestRepository = supportRequestRepository;
        this.moodEntryRepository = moodEntryRepository;
        this.tinyWinRepository = tinyWinRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Seed Administrator Account if not present
        if (!userRepository.existsByEmail(adminEmail.toLowerCase())) {
            User admin = new User();
            admin.setName(adminName);
            admin.setEmail(adminEmail.toLowerCase());
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            userRepository.save(admin);
        }

        // 2. Seed Demo Student if not present
        User student = userRepository.findByEmail("student@mindease.com").orElse(null);
        if (student == null) {
            student = new User();
            student.setName("Aarav Sharma");
            student.setEmail("student@mindease.com");
            student.setPassword(passwordEncoder.encode("Student@123"));
            student.setRole(Role.STUDENT);
            student.setActive(true);
            student = userRepository.save(student);

            // Seed initial wellness activity for demo student
            moodEntryRepository.save(new MoodEntry(student, "Happy"));
            moodEntryRepository.save(new MoodEntry(student, "Okay"));
            moodEntryRepository.save(new MoodEntry(student, "Anxious"));
            tinyWinRepository.save(new TinyWin(student, "Drank a glass of water", true));
            tinyWinRepository.save(new TinyWin(student, "Took five deep breaths", true));
            tinyWinRepository.save(new TinyWin(student, "Walked outside in sunlight", false));
        }

        // 3. Seed Demo Peer Listeners matching frontend profiles
        seedListener("Ananya Sen", "ananya@mindease.com", "🌷", 
                "A friendly ear for whatever is on your mind. Here to listen with empathy.", 
                "Academic Stress, Life Changes, Exam Anxiety", true, student);

        seedListener("Rahul Verma", "rahul@mindease.com", "🌿", 
                "Here to listen without judgment. Take all the time you need.", 
                "Loneliness, Friendships, Work-Life Balance", true, student);

        seedListener("Priya Patel", "priya@mindease.com", "🌼", 
                "Let's talk through things together. One breath at a time.", 
                "Motivation, Burnout, Self-Esteem", true, student);
    }

    private void seedListener(String name, String email, String avatar, String bio, String interests, boolean available, User student) {
        User listenerUser = userRepository.findByEmail(email.toLowerCase()).orElse(null);
        if (listenerUser == null) {
            listenerUser = new User();
            listenerUser.setName(name);
            listenerUser.setEmail(email.toLowerCase());
            listenerUser.setPassword(passwordEncoder.encode("Listener@123"));
            listenerUser.setRole(Role.LISTENER);
            listenerUser.setActive(true);
            listenerUser = userRepository.save(listenerUser);
        }

        ListenerProfile profile = listenerProfileRepository.findByUser(listenerUser).orElse(null);
        if (profile == null) {
            profile = new ListenerProfile();
            profile.setUser(listenerUser);
            profile.setDisplayName(name);
            profile.setAvatar(avatar);
            profile.setBio(bio);
            profile.setInterests(interests);
            profile.setAvailable(available);
            profile.setApprovalStatus("APPROVED");
            listenerProfileRepository.save(profile);
        }

        // Seed a pending sample support request if none exists for this listener
        if (student != null && supportRequestRepository.findByListenerOrderByCreatedAtDesc(listenerUser).isEmpty()) {
            SupportRequest request = new SupportRequest();
            request.setStudent(student);
            request.setListener(listenerUser);
            request.setTopic("Exam Stress & Balance");
            request.setMessage("Hi " + name + ", I've been feeling quite overwhelmed with my upcoming finals and could really use a sounding board.");
            request.setStatus(RequestStatus.PENDING);
            request.setCreatedAt(LocalDateTime.now().minusHours(2));
            supportRequestRepository.save(request);
        }
    }
}
