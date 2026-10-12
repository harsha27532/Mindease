
import { useState } from "react";
import "./App.css";

const moods = [
  "😊 Happy",
  "😔 Sad",
  "😞 Depressed",
  "😶 Numb",
  "😕 Confused",
  "🥺 Lonely",
];

const listeners = [
  { name: "Ananya", topic: "Stress and studies", rating: "4.9" },
  { name: "Rahul", topic: "Loneliness and friendship", rating: "4.8" },
  { name: "Priya", topic: "Confidence and motivation", rating: "4.9" },
];

export default function App() {
  const [mood, setMood] = useState("");
  const [journal, setJournal] = useState("");
  const [tasks, setTasks] = useState([
    { text: "Drink a glass of water", done: false },
    { text: "Take a five-minute break", done: false },
    { text: "Write one thing I am grateful for", done: false },
  ]);
  const [page, setPage] = useState("Home");

  const encouragement = {
    "😊 Happy": "Enjoy this moment. You deserve the good things in life!",
    "😔 Sad": "It's okay to feel sad. You don't have to figure everything out today.",
    "😞 Depressed": "You matter, even when things feel difficult. Consider reaching out to someone you trust.",
    "😶 Numb": "You don't need to force yourself to feel anything. Take things one step at a time.",
    "😕 Confused": "You don't need all the answers right now. One small step is enough.",
    "🥺 Lonely": "You deserve connection and care. Reaching out to someone can be a good first step.",
  };

  return (
    <div className="app">
      <header className="navbar">
        <h2 className="logo">Mind<span>Ease</span></h2>
        <nav>
          {["Home", "Listeners", "Journal", "Tiny Wins"].map((item) => (
            <button
              key={item}
              className={page === item ? "nav-link active" : "nav-link"}
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="profile">Your safe space ♡</div>
      </header>

      <main>
        {page === "Home" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">A LITTLE SPACE FOR YOU</p>
                <h1>You don't have to<br />have it all <span>figured out.</span></h1>
                <p className="hero-text">
                  Life can be a lot sometimes. Take a breath, check in with
                  yourself, and remember that you are not alone.
                </p>
                <button className="primary-btn" onClick={() =>
                  document.getElementById("mood-check").scrollIntoView({ behavior: "smooth" })
                }>
                  Check in with yourself →
                </button>
              </div>
              <div className="hero-art">
                <div className="sun">☀</div>
                <div className="plant">🌿</div>
                <div className="quote">
                  <span>“</span>
                  You are allowed to<br />grow at your own pace.
                  <small>A gentle reminder</small>
                </div>
              </div>
            </section>

            <section className="section" id="mood-check">
              <p className="eyebrow">YOUR DAILY CHECK-IN</p>
              <h2>How are you feeling today?</h2>
              <p className="muted">No judgement here. Just be honest with yourself.</p>
              <div className="mood-grid">
                {moods.map((item) => (
                  <button
                    key={item}
                    className={mood === item ? "mood selected" : "mood"}
                    onClick={() => setMood(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {mood && (
                <div className="encouragement">
                  <strong>A note for you 💌</strong>
                  <p>{encouragement[mood]}</p>
                  <button className="text-btn" onClick={() => setPage("Listeners")}>
                    Find someone to talk to →
                  </button>
                </div>
              )}
            </section>

            <section className="section">
              <p className="eyebrow">A LITTLE SUPPORT</p>
              <h2>You don't have to do it alone.</h2>
              <div className="feature-grid">
                <article className="feature lavender">
                  <span className="feature-icon">💬</span>
                  <h3>Talk to someone</h3>
                  <p>Find a peer listener who is ready to hear you out.</p>
                  <button className="text-btn" onClick={() => setPage("Listeners")}>Explore listeners →</button>
                </article>
                <article className="feature peach">
                  <span className="feature-icon">📔</span>
                  <h3>Let it out</h3>
                  <p>Write your thoughts in your own private journal.</p>
                  <button className="text-btn" onClick={() => setPage("Journal")}>Open journal →</button>
                </article>
                <article className="feature sage">
                  <span className="feature-icon">🌱</span>
                  <h3>Celebrate tiny wins</h3>
                  <p>Small steps count. Give yourself credit for them.</p>
                  <button className="text-btn" onClick={() => setPage("Tiny Wins")}>See tiny wins →</button>
                </article>
              </div>
            </section>
          </>
        )}

        {page === "Listeners" && (
          <section className="section page-section">
            <p className="eyebrow">YOU DESERVE TO BE HEARD</p>
            <h1>Meet your peer listeners.</h1>
            <p className="muted">Choose someone whose support topics feel right for you.</p>
            <div className="listener-grid">
              {listeners.map((person) => (
                <article className="listener-card" key={person.name}>
                  <div className="avatar">{person.name[0]}</div>
                  <h3>{person.name}</h3>
                  <p>{person.topic}</p>
                  <p>⭐ {person.rating} <span className="muted">· Demo rating</span></p>
                  <button className="primary-btn" onClick={() =>
                    alert("This is a frontend demo. Messaging needs a connected backend.")
                  }>View listener</button>
                </article>
              ))}
            </div>
            <p className="notice">These are sample profiles, not real verified listeners. Peer support is not a replacement for professional care.</p>
          </section>
        )}

        {page === "Journal" && (
          <section className="section page-section">
            <p className="eyebrow">YOUR PERSONAL SPACE</p>
            <h1>Let your thoughts breathe.</h1>
            <p className="muted">Write freely. Your draft stays in this browser on this device.</p>
            <textarea
              className="journal"
              value={journal}
              onChange={(event) => setJournal(event.target.value)}
              placeholder="What's on your mind today?"
            />
            <button className="primary-btn" onClick={() => {
              localStorage.setItem("mindease-journal", journal);
              alert("Journal draft saved on this device.");
            }}>Save journal draft</button>
            <p className="notice">Demo only: browser storage is not an authenticated or secure private journal. Don't enter sensitive information on a shared device.</p>
          </section>
        )}

        {page === "Tiny Wins" && (
          <section className="section page-section">
            <p className="eyebrow">PROGRESS, NOT PERFECTION</p>
            <h1>Small steps still count. 🌱</h1>
            <p className="muted">Tick off anything you manage today. Every little win matters.</p>
            <div className="task-list">
              {tasks.map((task, index) => (
                <label className="task" key={task.text}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => setTasks((old) =>
                      old.map((item, i) => i === index ? { ...item, done: !item.done } : item)
                    )}
                  />
                  <span className={task.done ? "completed" : ""}>{task.text}</span>
                  {task.done && <span>🌱</span>}
                </label>
              ))}
              <p className="muted">{tasks.filter((task) => task.done).length} of {tasks.length} tiny wins completed</p>
            </div>
          </section>
        )}
      </main>

      <footer>
        <h2 className="logo">Mind<span>Ease</span> ♡</h2>
        <p>A gentle reminder: you matter, exactly as you are.</p>
        <small>MindEase is a student wellbeing demo, not a medical service.</small>
      </footer>
    </div>
  );
}

