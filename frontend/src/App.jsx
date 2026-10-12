import { useState } from "react";
import "./App.css";
import AdminDashboard from "./components/AdminDashboard.jsx";
import PeerListenerDashboard from "./components/PeerListenerDashboard.jsx";

const API_URL = "http://localhost:8080/api/auth";

const roles = [
  { id: "STUDENT", title: "Student", icon: "🎓", description: "Your personal space to feel better" },
  { id: "ADMIN", title: "Admin", icon: "🛡️", description: "Manage the MindEase platform" },
  { id: "LISTENER", title: "Peer Listener", icon: "💚", description: "Support others by listening" },
];

const listeners = [
  { name: "Ananya", role: "Peer Listener", emoji: "🌷", description: "A friendly ear for whatever is on your mind." },
  { name: "Rahul", role: "Peer Listener", emoji: "🌿", description: "Here to listen without judgment." },
  { name: "Priya", role: "Peer Listener", emoji: "🌼", description: "Let's talk through things together." },
];

const initialWins = [
  { id: 1, text: "Drink a glass of water", done: false },
  { id: 2, text: "Take five deep breaths", done: false },
  { id: 3, text: "Step outside for some fresh air", done: false },
];

const moods = [
  { name: "Happy", emoji: "😊", color: "#fff4d9", message: "Let yourself enjoy this moment. You deserve the good days, too." },
  { name: "Okay", emoji: "🙂", color: "#edf4e9", message: "It's okay to simply be okay. You don't have to feel amazing every day." },
  { name: "Anxious", emoji: "😟", color: "#fcebe5", message: "Take one slow breath. You only need to focus on the next small step." },
  { name: "Sad", emoji: "😔", color: "#e9effa", message: "You don't have to push your feelings away. Give yourself some kindness." },
  { name: "Overwhelmed", emoji: "😵‍💫", color: "#f0eafa", message: "Pause for a moment. You can do one thing at a time." },
];

const journalThemes = [
  { name: "Sage", value: "#edf4e9" },
  { name: "Blush", value: "#fff0ed" },
  { name: "Lavender", value: "#f1edfb" },
  { name: "Sunshine", value: "#fff6dc" },
];

const initialPrompts = [
  "What is one thing I wish someone understood about me?",
  "What made me smile today, even for a moment?",
  "What would I tell a friend who felt the way I do?",
  "What is something I can let go of for today?",
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The application remains usable if browser storage is unavailable.
  }
}

function MindEaseSidePanel() {
  return (
    <aside className="mindscape">
      <a
        href="#"
        className="mindscape-logo"
        onClick={(event) => event.preventDefault()}
      >
        <span className="brand-leaf">✿</span>
        MindEase<span className="logo-dot">.</span>
      </a>

      <div className="mindscape-copy">
        <span className="mindscape-eyebrow">A MOMENT JUST FOR YOU</span>
        <h1>A safe space<br /><em>for your mind.</em></h1>
        <p>
          Life can be a lot sometimes. Take a breath, slow down,
          and remember that you don't have to figure everything out today.
        </p>
      </div>

      <div className="mindscape-art" aria-hidden="true">
        <div className="art-sun" />
        <div className="art-cloud art-cloud-one" />
        <div className="art-cloud art-cloud-two" />
        <div className="art-mountain art-mountain-back" />
        <div className="art-mountain art-mountain-front" />
        <div className="art-water" />
        <div className="art-water-line line-one" />
        <div className="art-water-line line-two" />
        <div className="art-water-line line-three" />
        <div className="art-person">
          <div className="person-head" />
          <div className="person-body" />
          <div className="person-leg person-leg-one" />
          <div className="person-leg person-leg-two" />
        </div>
        <div className="art-grass grass-left">✦</div>
        <div className="art-grass grass-right">✿</div>
      </div>

      <div className="mindscape-bottom">
        <div className="mindscape-feature">
          <span>♡</span>
          <div>
            <strong>A little more calm</strong>
            <small>Make space for your feelings</small>
          </div>
        </div>
        <div className="mindscape-feature">
          <span>☘</span>
          <div>
            <strong>One step at a time</strong>
            <small>Your journey, your pace</small>
          </div>
        </div>
      </div>

      <span className="mindscape-decoration decoration-one">✳</span>
      <span className="mindscape-decoration decoration-two">✿</span>
    </aside>
  );
}

function App() {
  // Authentication state — existing flow retained
  const [selectedRole, setSelectedRole] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Dashboard state
  const [activePage, setActivePage] = useState("Home");
  const [mood, setMood] = useState("");
  const [moodHistory, setMoodHistory] = useState(
    () => readStorage("mindease-mood-history", [])
  );

  const [journalEntries, setJournalEntries] = useState(
    () => readStorage("mindease-journal-entries", [])
  );
  const [journalTitle, setJournalTitle] = useState("");
  const [journalText, setJournalText] = useState("");
  const [journalTheme, setJournalTheme] = useState("#edf4e9");
  const [journalFilter, setJournalFilter] = useState("All");
  const [journalPrompt, setJournalPrompt] = useState("");

  const [futureLetters, setFutureLetters] = useState(
    () => readStorage("mindease-future-letters", [])
  );
  const [letterText, setLetterText] = useState("");
  const [letterDate, setLetterDate] = useState("");
  const [letterTitle, setLetterTitle] = useState("");
  const [openedLetter, setOpenedLetter] = useState(null);

  const [wins, setWins] = useState(
    () => readStorage("mindease-wins", initialWins)
  );
  const [newWin, setNewWin] = useState("");

  function clearAuthMessages() {
    setLoginError("");
    setRegisterMessage("");
  }

  function selectRole(roleId) {
    setSelectedRole(roleId);
    setIsRegistering(false);
    setEmail("");
    setPassword("");
    setFullName("");
    clearAuthMessages();
  }

  function goBackToRoles() {
    setSelectedRole(null);
    setIsRegistering(false);
    setEmail("");
    setPassword("");
    setFullName("");
    clearAuthMessages();
  }

  function switchAuthMode(registering) {
    setIsRegistering(registering);
    setPassword("");
    setFullName("");
    clearAuthMessages();
  }

  async function handleLogin(event) {
    event.preventDefault();
    clearAuthMessages();

    if (!selectedRole) {
      setLoginError("Please select your role first.");
      return;
    }

    if (!email.trim() || !password) {
      setLoginError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Invalid email or password.");
      }

      if (data.role !== selectedRole) {
        const roleName =
          selectedRole === "LISTENER"
            ? "Peer Listener"
            : selectedRole === "ADMIN"
            ? "Admin"
            : "Student";

        setLoginError(
          `This account does not have the ${roleName} role. Please select the correct role.`
        );
        return;
      }

      setUser(data);
      setActivePage("Home");
      setPassword("");
      setMood("");
    } catch (error) {
      setLoginError(
        error instanceof TypeError
          ? "Cannot connect to the backend. Check that Spring Boot is running on port 8080 and CORS is configured."
          : error.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    clearAuthMessages();

    if (!fullName.trim() || !email.trim() || !password) {
      setLoginError("Please fill in all fields.");
      return;
    }

    if (!["STUDENT", "LISTENER"].includes(selectedRole)) {
      setLoginError(
        "Public registration is available for Students and Peer Listeners only."
      );
      return;
    }

    if (password.length < 8) {
      setLoginError("Your password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          password,
          role: selectedRole,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            (response.status === 409
              ? "This email is already registered. Please sign in."
              : "Registration failed. Please try again.")
        );
      }

      setRegisterMessage(
        "Account created successfully! Sign in with your new email and password."
      );
      setIsRegistering(false);
      setFullName("");
      setPassword("");
    } catch (error) {
      setLoginError(
        error instanceof TypeError
          ? "Cannot connect to the backend. Check that Spring Boot is running on port 8080."
          : error.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setUser(null);
    setSelectedRole(null);
    setEmail("");
    setPassword("");
    setFullName("");
    setIsRegistering(false);
    clearAuthMessages();
    setMood("");
    setActivePage("Home");
  }

  // Mood history
  function recordMood(selectedMood) {
    setMood(selectedMood);

    const entry = {
      id: Date.now(),
      mood: selectedMood,
      date: new Date().toISOString(),
      user: user?.email || "local-user",
    };

    setMoodHistory((current) => {
      const updated = [entry, ...current].slice(0, 100);
      saveStorage("mindease-mood-history", updated);
      return updated;
    });
  }

  // Journal entries
  function saveJournalEntry(event) {
    event.preventDefault();

    if (!journalText.trim()) return;

    const entry = {
      id: Date.now(),
      title: journalTitle.trim() || "A little reflection",
      text: journalText.trim(),
      theme: journalTheme,
      date: new Date().toISOString(),
      user: user?.email || "local-user",
    };

    setJournalEntries((current) => {
      const updated = [entry, ...current];
      saveStorage("mindease-journal-entries", updated);
      return updated;
    });

    setJournalTitle("");
    setJournalText("");
    setJournalPrompt("");
  }

  function deleteJournalEntry(id) {
    if (!window.confirm("Delete this journal entry? This cannot be undone.")) return;

    setJournalEntries((current) => {
      const updated = current.filter((entry) => entry.id !== id);
      saveStorage("mindease-journal-entries", updated);
      return updated;
    });
  }

  // Future-self letters
  function saveFutureLetter(event) {
    event.preventDefault();

    if (!letterText.trim() || !letterDate) return;

    const entry = {
      id: Date.now(),
      title: letterTitle.trim() || "Dear future me",
      text: letterText.trim(),
      unlockDate: letterDate,
      createdAt: new Date().toISOString(),
      user: user?.email || "local-user",
    };

    setFutureLetters((current) => {
      const updated = [entry, ...current];
      saveStorage("mindease-future-letters", updated);
      return updated;
    });

    setLetterText("");
    setLetterTitle("");
    setLetterDate("");
  }

  function deleteFutureLetter(id) {
    if (!window.confirm("Delete this letter?")) return;

    setFutureLetters((current) => {
      const updated = current.filter((letter) => letter.id !== id);
      saveStorage("mindease-future-letters", updated);
      return updated;
    });
  }

  // Tiny wins
  function toggleWin(id) {
    setWins((current) => {
      const updated = current.map((win) =>
        win.id === id ? { ...win, done: !win.done } : win
      );
      saveStorage("mindease-wins", updated);
      return updated;
    });
  }

  function addWin(event) {
    event.preventDefault();
    if (!newWin.trim()) return;

    setWins((current) => {
      const updated = [
        ...current,
        { id: Date.now(), text: newWin.trim(), done: false },
      ];
      saveStorage("mindease-wins", updated);
      return updated;
    });

    setNewWin("");
  }

  function goTo(page) {
    setActivePage(page);
    setOpenedLetter(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const visibleMoodHistory = moodHistory.filter(
    (entry) => entry.user === (user?.email || "local-user")
  );

  const visibleJournalEntries = journalEntries.filter(
    (entry) => entry.user === (user?.email || "local-user")
  );

  const visibleFutureLetters = futureLetters.filter(
    (entry) => entry.user === (user?.email || "local-user")
  );

  const completedWins = wins.filter((win) => win.done).length;

  // ROLE SELECTION — original authentication design
  if (!selectedRole) {
    return (
      <div className="auth-layout">
        <MindEaseSidePanel />
        <main className="auth-right">
          <section className="auth-card">
            <span className="auth-eyebrow">WELCOME TO MINDEASE</span>
            <h2>Let's make space for you.</h2>
            <p className="auth-description">Choose how you'd like to continue.</p>

            <div className="role-grid">
              {roles.map((role) => (
                <button
                  type="button"
                  className="role-card"
                  key={role.id}
                  onClick={() => selectRole(role.id)}
                >
                  <span className="role-icon">{role.icon}</span>
                  <span className="role-title">{role.title}</span>
                  <span className="role-description">{role.description}</span>
                  <span className="role-arrow">→</span>
                </button>
              ))}
            </div>

            <p className="auth-note">
              Your well-being matters. Take it one step at a time.
            </p>
          </section>
        </main>
      </div>
    );
  }

  // LOGIN AND REGISTRATION — original API flow
  if (!user) {
    const role = roles.find((item) => item.id === selectedRole);

    return (
      <div className="auth-layout">
        <MindEaseSidePanel />
        <main className="auth-right">
          <section className="auth-card">
            <button type="button" className="auth-back" onClick={goBackToRoles}>
              ← Back to role selection
            </button>

            <span className="auth-eyebrow">
              {isRegistering ? "YOUR JOURNEY STARTS HERE" : "YOUR SPACE AWAITS"}
            </span>

            <h2>{isRegistering ? "Join MindEase." : "Welcome back."}</h2>

            <p className="auth-description">
              {isRegistering
                ? "Create an account and begin your MindEase journey."
                : "Sign in to continue your MindEase journey."}
            </p>

            <div className="selected-role">
              <span className="selected-role-dot" />
              {isRegistering ? "Creating an account as " : "Signing in as "}
              <strong>{role?.title || selectedRole}</strong>
            </div>

            {isRegistering && selectedRole === "ADMIN" && (
              <div className="login-error" role="alert">
                Admin accounts cannot be created through public signup.
                Use an existing administrator account to sign in.
              </div>
            )}

            <form
              className="login-form"
              onSubmit={isRegistering ? handleRegister : handleLogin}
            >
              {isRegistering && (
                <>
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </>
              )}

              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                maxLength={254}
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder={
                  isRegistering
                    ? "Create a password (at least 8 characters)"
                    : "Enter your password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength={isRegistering ? 8 : undefined}
                required
              />

              {loginError && (
                <div className="login-error" role="alert">{loginError}</div>
              )}

              {registerMessage && (
                <div className="register-message" role="status">
                  {registerMessage}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary login-submit"
                disabled={loading || (isRegistering && selectedRole === "ADMIN")}
              >
                {loading
                  ? "Please wait..."
                  : isRegistering
                  ? "Create account"
                  : "Sign in to MindEase"}
                {!loading && <span>→</span>}
              </button>
            </form>

            {selectedRole !== "ADMIN" && (
              <p className="auth-note">
                {isRegistering ? "Already have an account?" : "New to MindEase?"}{" "}
                <button
                  type="button"
                  className="auth-mode-toggle"
                  onClick={() => switchAuthMode(!isRegistering)}
                >
                  {isRegistering ? "Sign in" : "Create an account"}
                </button>
              </p>
            )}

            <p className="auth-note">A gentle reminder: you deserve care, too. ♡</p>
          </section>
        </main>
      </div>
    );
  }

  // ROLE-BASED DASHBOARD ROUTING
  if (user?.role === "ADMIN") {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  if (user?.role === "LISTENER") {
    return <PeerListenerDashboard user={user} onLogout={handleLogout} />;
  }

  // STUDENT DASHBOARD (100% UNTOUCHED ORIGINAL DESIGN AND BEHAVIOR)
  return (
    <div className="app-container">
      <header className="navbar">
        <button type="button" className="navbar-logo" onClick={() => goTo("Home")}>
          <span className="brand-leaf">✿</span>
          MindEase<span className="logo-dot">.</span>
        </button>

        <nav className="navbar-links" aria-label="Main navigation">
          {["Home", "Mood History", "Listeners", "Journal", "Future Me", "Tiny Wins"].map((page) => (
            <button
              type="button"
              key={page}
              className={`nav-link ${activePage === page ? "active" : ""}`}
              onClick={() => goTo(page)}
            >
              {page}
            </button>
          ))}
        </nav>

        <div className="navbar-user">
          <span>Hi, {user.name || user.email.split("@")[0]} 🌿</span>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {activePage === "Home" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <span className="hero-badge">YOUR SPACE, YOUR PACE</span>
                <h1>You don't have to<br /><span>have it all figured out.</span></h1>
                <p>
                  Hi {user.name || "there"}. Whatever today feels like,
                  there's room for you here. Take things one breath at a time.
                </p>
                <div className="hero-actions">
                  <button type="button" className="btn-primary" onClick={() => goTo("Journal")}>
                    Write your thoughts →
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => goTo("Future Me")}>
                    Write to future me
                  </button>
                </div>
              </div>
              <div className="hero-illustration" aria-hidden="true">
                <span>☁️</span><span>🌿</span><span>☀️</span>
              </div>
            </section>

            <section className="section mood-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">CHECK IN WITH YOURSELF</span>
                  <h2>How are you feeling today?</h2>
                  <p>No right or wrong answers. Just notice how you feel.</p>
                </div>
                <button type="button" className="text-link" onClick={() => goTo("Mood History")}>
                  View mood history →
                </button>
              </div>

              <div className="mood-grid">
                {moods.map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    className={`mood-card ${mood === item.name ? "selected" : ""}`}
                    onClick={() => recordMood(item.name)}
                    style={mood === item.name ? { background: item.color } : undefined}
                  >
                    <span className="mood-emoji">{item.emoji}</span>
                    <strong>{item.name}</strong>
                  </button>
                ))}
              </div>

              {mood && (
                <div className="mood-message">
                  <strong>{moods.find((item) => item.name === mood)?.emoji} Thank you for checking in.</strong>
                  <p>{moods.find((item) => item.name === mood)?.message}</p>
                  <small>Your check-in has been added to your mood history.</small>
                </div>
              )}
            </section>

            <section className="encouragement">
              <span className="encouragement-icon">🌱</span>
              <div>
                <h3>A gentle reminder</h3>
                <p>Progress isn't always loud. Sometimes showing up is enough.</p>
              </div>
              <span className="encouragement-heart">♡</span>
            </section>

            <section className="section features-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">SMALL STEPS COUNT</span>
                  <h2>Your well-being corner</h2>
                  <p>Choose what feels right for you today.</p>
                </div>
              </div>

              <div className="feature-grid">
                <button type="button" className="feature-card" onClick={() => goTo("Listeners")}>
                  <span className="feature-icon">💚</span>
                  <h3>Talk to someone</h3>
                  <p>Find a friendly ear and share what's on your mind.</p>
                  <span className="feature-link">Meet listeners →</span>
                </button>

                <button type="button" className="feature-card" onClick={() => goTo("Journal")}>
                  <span className="feature-icon">📔</span>
                  <h3>Write it out</h3>
                  <p>Give your thoughts a place to land. No judgment here.</p>
                  <span className="feature-link">Open journal →</span>
                </button>

                <button type="button" className="feature-card" onClick={() => goTo("Future Me")}>
                  <span className="feature-icon">💌</span>
                  <h3>Dear future me</h3>
                  <p>Leave a little reminder for the person you're becoming.</p>
                  <span className="feature-link">Write a letter →</span>
                </button>

                <button type="button" className="feature-card" onClick={() => goTo("Tiny Wins")}>
                  <span className="feature-icon">✨</span>
                  <h3>Celebrate little wins</h3>
                  <p>Small acts of care are worth celebrating.</p>
                  <span className="feature-link">See your wins →</span>
                </button>

                <button type="button" className="feature-card" onClick={() => goTo("Mood History")}>
                  <span className="feature-icon">🌦️</span>
                  <h3>Your mood journey</h3>
                  <p>Reflect on your check-ins and notice how your days feel.</p>
                  <span className="feature-link">View history →</span>
                </button>

                <button type="button" className="feature-card" onClick={() => goTo("Journal")}>
                  <span className="feature-icon">🪷</span>
                  <h3>A mindful pause</h3>
                  <p>Take a moment to breathe and write one thing you need.</p>
                  <span className="feature-link">Take a pause →</span>
                </button>
              </div>
            </section>

            <section className="section home-summary">
              <div className="summary-card">
                <span>🌦️</span>
                <div>
                  <strong>{visibleMoodHistory.length}</strong>
                  <p>Mood check-ins recorded</p>
                </div>
              </div>
              <div className="summary-card">
                <span>📔</span>
                <div>
                  <strong>{visibleJournalEntries.length}</strong>
                  <p>Journal entries saved</p>
                </div>
              </div>
              <div className="summary-card">
                <span>🌱</span>
                <div>
                  <strong>{completedWins}</strong>
                  <p>Tiny wins completed</p>
                </div>
              </div>
            </section>
          </>
        )}

        {activePage === "Mood History" && (
          <section className="section page-section">
            <span className="eyebrow">YOUR FEELINGS MATTER</span>
            <h1>Your mood journey 🌦️</h1>
            <p>Every check-in is a moment of self-awareness. Look back with kindness, not judgment.</p>

            <div className="history-summary">
              <div className="summary-card">
                <span>💚</span>
                <div><strong>{visibleMoodHistory.length}</strong><p>Total check-ins</p></div>
              </div>
              <div className="summary-card">
                <span>🌿</span>
                <div><strong>{new Set(visibleMoodHistory.map((item) => new Date(item.date).toDateString())).size}</strong><p>Days checked in</p></div>
              </div>
            </div>

            {visibleMoodHistory.length === 0 ? (
              <div className="empty-state">
                <span>🌱</span>
                <h3>Your journey starts with one check-in.</h3>
                <p>Come back to Home and choose the mood that best describes how you feel.</p>
                <button type="button" className="btn-primary" onClick={() => goTo("Home")}>Check in now</button>
              </div>
            ) : (
              <>
                <div className="mood-breakdown">
                  {moods.map((item) => {
                    const count = visibleMoodHistory.filter((entry) => entry.mood === item.name).length;
                    const percentage = (count / visibleMoodHistory.length) * 100;
                    return (
                      <div className="breakdown-row" key={item.name}>
                        <span className="breakdown-emoji">{item.emoji}</span>
                        <span className="breakdown-name">{item.name}</span>
                        <div className="breakdown-track">
                          <div className="breakdown-fill" style={{ width: `${percentage}%`, background: item.color }} />
                        </div>
                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                </div>

                <h2 className="history-subheading">Recent check-ins</h2>
                <div className="history-list">
                  {visibleMoodHistory.map((entry) => {
                    const item = moods.find((candidate) => candidate.name === entry.mood);
                    return (
                      <article className="history-item" key={entry.id}>
                        <span className="history-emoji" style={{ background: item?.color }}>{item?.emoji || "🌿"}</span>
                        <div>
                          <h3>{entry.mood}</h3>
                          <p>{item?.message}</p>
                          <small>{new Date(entry.date).toLocaleString()}</small>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
            <p className="privacy-note">Mood history is stored in this browser. It is a reflection tool, not a diagnosis.</p>
          </section>
        )}

        {activePage === "Listeners" && (
          <section className="section page-section">
            <span className="eyebrow">YOU DON'T HAVE TO DO IT ALONE</span>
            <h1>Meet your peer listeners 💚</h1>
            <p>Find a friendly space to share what's on your mind, at your own pace.</p>

            <div className="listener-note">
              <span>🤝</span>
              <p><strong>Listening without judgment.</strong> Peer listeners can offer support and a space to talk. They are not a replacement for professional mental-health care.</p>
            </div>

            <div className="listener-grid">
              {listeners.map((listener) => (
                <article className="listener-card" key={listener.name}>
                  <div className="listener-avatar">{listener.emoji}</div>
                  <h3>{listener.name}</h3>
                  <p className="listener-role">{listener.role}</p>
                  <p>{listener.description}</p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => window.alert("Peer listener messaging is not connected yet. A messaging feature can be integrated with your backend next.")}
                  >
                    Connect →
                  </button>
                </article>
              ))}
            </div>
            <p className="privacy-note">The Connect button is a placeholder until listener messaging is implemented in the backend.</p>
          </section>
        )}

        {activePage === "Journal" && (
          <section className="section page-section">
            <span className="eyebrow">A SPACE JUST FOR YOU</span>
            <h1>Your little journal 📔</h1>
            <p>Let your thoughts flow. They don't need to be perfect, polished, or even make sense yet.</p>

            <div className="journal-layout">
              <div className="journal-compose">
                <div className="journal-card">
                  <div className="journal-card-heading">
                    <span>✍️</span>
                    <div><h2>A moment with yourself</h2><p>Write whatever you need to let out.</p></div>
                  </div>

                  <form className="journal-form" onSubmit={saveJournalEntry}>
                    <label htmlFor="journal-title">Give this entry a title (optional)</label>
                    <input
                      id="journal-title"
                      type="text"
                      value={journalTitle}
                      onChange={(event) => setJournalTitle(event.target.value)}
                      placeholder="A thought, a feeling, a little win..."
                      maxLength={120}
                    />

                    <label htmlFor="journal-entry">What's on your mind?</label>
                    <textarea
                      id="journal-entry"
                      rows={8}
                      value={journalText}
                      onChange={(event) => setJournalText(event.target.value)}
                      placeholder="Start writing here. This space is yours..."
                      required
                    />

                    <label>Choose your page colour</label>
                    <div className="journal-themes">
                      {journalThemes.map((theme) => (
                        <button
                          type="button"
                          key={theme.name}
                          className={`journal-theme ${journalTheme === theme.value ? "active" : ""}`}
                          style={{ background: theme.value }}
                          aria-label={`${theme.name} journal theme`}
                          title={theme.name}
                          onClick={() => setJournalTheme(theme.value)}
                        >
                          {journalTheme === theme.value ? "✓" : ""}
                        </button>
                      ))}
                    </div>

                    <div className="journal-form-actions">
                      <button type="submit" className="btn-primary">Save my entry ♡</button>
                      <button type="button" className="btn-secondary" onClick={() => { setJournalTitle(""); setJournalText(""); }}>
                        Clear
                      </button>
                    </div>
                  </form>
                </div>

                <div className="prompt-card">
                  <span>💭 A gentle prompt</span>
                  <p>{journalPrompt || initialPrompts[0]}</p>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      const current = initialPrompts.indexOf(journalPrompt);
                      setJournalPrompt(initialPrompts[(current + 1) % initialPrompts.length]);
                    }}
                  >
                    Give me another prompt ↻
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setJournalText((current) => `${current}${current ? "\n\n" : ""}${journalPrompt || initialPrompts[0]}\n`)}
                  >
                    Write about this →
                  </button>
                </div>
              </div>

              <aside className="journal-side">
                <div className="journal-tip">
                  <span>🌿</span>
                  <h3>No perfect words needed.</h3>
                  <p>You can write one sentence or ten pages. Both count.</p>
                </div>
                <div className="journal-tip">
                  <span>🫶</span>
                  <h3>Be kind to yourself.</h3>
                  <p>Try writing to yourself the way you'd speak to someone you love.</p>
                </div>
                <div className="journal-tip">
                  <span>🔒</span>
                  <h3>Your personal space.</h3>
                  <p>Entries are saved in this browser, not uploaded to the server.</p>
                </div>
              </aside>
            </div>

            <div className="saved-journal">
              <div className="section-heading">
                <div><h2>Your reflections</h2><p>Look back at what you've written.</p></div>
                <select value={journalFilter} onChange={(event) => setJournalFilter(event.target.value)} aria-label="Filter journal entries">
                  <option value="All">All entries</option>
                  <option value="Newest">Newest first</option>
                  <option value="Oldest">Oldest first</option>
                </select>
              </div>

              {visibleJournalEntries.length === 0 ? (
                <div className="empty-state">
                  <span>📖</span>
                  <h3>Your first page is waiting.</h3>
                  <p>When you save a journal entry, it will appear here.</p>
                </div>
              ) : (
                [...visibleJournalEntries]
                  .sort((a, b) => journalFilter === "Oldest" ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date))
                  .map((entry) => (
                    <article className="journal-entry" style={{ background: entry.theme || "#edf4e9" }} key={entry.id}>
                      <div className="journal-entry-header">
                        <div><h3>{entry.title}</h3><small>{new Date(entry.date).toLocaleString()}</small></div>
                        <button type="button" className="delete-button" onClick={() => deleteJournalEntry(entry.id)} aria-label={`Delete ${entry.title}`}>✕</button>
                      </div>
                      <p>{entry.text}</p>
                    </article>
                  ))
              )}
            </div>
          </section>
        )}

        {activePage === "Future Me" && (
          <section className="section page-section">
            <span className="eyebrow">A LITTLE LOVE THROUGH TIME</span>
            <h1>Dear future me 💌</h1>
            <p>Leave a message for the person you're becoming. You deserve encouragement from yourself, too.</p>

            <div className="future-hero">
              <span>🌷</span>
              <div>
                <h2>Write from today. Read with tomorrow's eyes.</h2>
                <p>Write about what you're going through, what you hope for, or what you want to remember.</p>
              </div>
            </div>

            <div className="future-compose">
              <form className="journal-form" onSubmit={saveFutureLetter}>
                <label htmlFor="letter-title">Letter title</label>
                <input
                  id="letter-title"
                  value={letterTitle}
                  onChange={(event) => setLetterTitle(event.target.value)}
                  placeholder="A reminder for a difficult day..."
                  maxLength={120}
                />

                <label htmlFor="letter-text">Dear future me...</label>
                <textarea
                  id="letter-text"
                  rows={8}
                  value={letterText}
                  onChange={(event) => setLetterText(event.target.value)}
                  placeholder="I hope you remember that..."
                  required
                />

                <label htmlFor="letter-date">When would you like to open this letter?</label>
                <input
                  id="letter-date"
                  type="date"
                  value={letterDate}
                  min={new Date().toLocaleDateString("en-CA")}
                  required
                  onChange={(event) => setLetterDate(event.target.value)}
                />

                <p className="privacy-note">Letters are stored locally in this browser. This is a reminder feature, not an encrypted messaging service.</p>
                <button type="submit" className="btn-primary">Seal my letter 💌</button>
              </form>
            </div>

            <div className="future-letters">
              <div className="section-heading">
                <div><h2>Your letters</h2><p>Every message is a little act of self-kindness.</p></div>
              </div>

              {visibleFutureLetters.length === 0 ? (
                <div className="empty-state">
                  <span>💌</span>
                  <h3>No letters yet.</h3>
                  <p>Write your first message to future you above.</p>
                </div>
              ) : (
                <div className="future-letter-grid">
                  {visibleFutureLetters.map((letter) => {
                    const isUnlocked = new Date(`${letter.unlockDate}T00:00:00`) <= new Date();
                    return (
                      <article className="future-letter-card" key={letter.id}>
                        <span className="letter-icon">{isUnlocked ? "💌" : "🔒"}</span>
                        <h3>{letter.title}</h3>
                        <p>For: {new Date(`${letter.unlockDate}T00:00:00`).toLocaleDateString()}</p>
                        <span className={`status-badge ${isUnlocked ? "unlocked" : ""}`}>
                          {isUnlocked ? "Ready to open" : "Waiting for its day"}
                        </span>
                        <div className="letter-actions">
                          <button type="button" className="btn-secondary" disabled={!isUnlocked} onClick={() => setOpenedLetter(letter)}>
                            {isUnlocked ? "Open letter" : "Not yet"}
                          </button>
                          <button type="button" className="delete-button" onClick={() => deleteFutureLetter(letter.id)} aria-label={`Delete ${letter.title}`}>✕</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {openedLetter && (
              <div className="letter-overlay" role="dialog" aria-modal="true" aria-labelledby="opened-letter-title">
                <article className="opened-letter">
                  <button type="button" className="delete-button letter-close" onClick={() => setOpenedLetter(null)} aria-label="Close letter">✕</button>
                  <span>💌 A message from your past self</span>
                  <h2 id="opened-letter-title">{openedLetter.title}</h2>
                  <p className="letter-body">{openedLetter.text}</p>
                  <small>Written on {new Date(openedLetter.createdAt).toLocaleDateString()}</small>
                  <button type="button" className="btn-primary" onClick={() => setOpenedLetter(null)}>Keep going, future me ♡</button>
                </article>
              </div>
            )}
          </section>
        )}

        {activePage === "Tiny Wins" && (
          <section className="section page-section">
            <span className="eyebrow">ONE SMALL STEP AT A TIME</span>
            <h1>Your tiny wins ✨</h1>
            <p>You don't need to do everything today. Start with one small thing and give yourself credit for it.</p>

            <div className="wins-intro">
              <span>🌱</span>
              <div>
                <h2>Look how far you've come.</h2>
                <p>Resting, asking for help, and trying again can all be wins.</p>
              </div>
            </div>

            <div className="wins-card">
              <div className="wins-progress-header">
                <div>
                  <h2>Today's little steps</h2>
                  <p>{completedWins === wins.length && wins.length > 0 ? "You did it! Celebrate yourself. 🎉" : "Every small step counts."}</p>
                </div>
                <strong>{completedWins}/{wins.length}</strong>
              </div>

              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${wins.length ? (completedWins / wins.length) * 100 : 0}%` }} />
              </div>

              <div className="wins-list">
                {wins.map((win) => (
                  <label className={`win-item ${win.done ? "completed" : ""}`} key={win.id}>
                    <input type="checkbox" checked={win.done} onChange={() => toggleWin(win.id)} />
                    <span className={win.done ? "win-done" : ""}>{win.text}</span>
                    {win.done && <span className="win-sprout">🌱</span>}
                  </label>
                ))}
              </div>

              <form className="add-win-form" onSubmit={addWin}>
                <input
                  type="text"
                  value={newWin}
                  onChange={(event) => setNewWin(event.target.value)}
                  placeholder="Add a tiny win of your own..."
                  maxLength={150}
                  aria-label="New tiny win"
                />
                <button type="submit" className="btn-primary">Add +</button>
              </form>
            </div>

            <div className="win-ideas">
              <h2>Need an idea for a tiny win?</h2>
              <p>Choose one that feels manageable today.</p>
              <div className="win-idea-list">
                {["Send a message to someone I care about", "Take a five-minute break", "Eat something nourishing", "Step away from my screen", "Ask for help when I need it", "Give myself permission to rest"].map((idea) => (
                  <button type="button" className="win-idea" key={idea} onClick={() => setNewWin(idea)}>
                    <span>＋</span>{idea}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>MindEase · Take a breath. You're doing okay. 💚</p>
        <p>A gentle space for reflection, connection, and small steps forward.</p>
      </footer>
    </div>
  );
}

export default App;