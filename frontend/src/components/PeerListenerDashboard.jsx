import { useState, useEffect, useCallback } from "react";
import "./PeerListenerDashboard.css";

const API_BASE = "http://localhost:8080/api/listener";

const AVATAR_OPTIONS = ["🌿", "🌷", "🌼", "🌱", "🌸", "☀️", "🌻", "🪷"];

export default function PeerListenerDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("requests"); // 'overview', 'requests', 'sessions', 'profile'
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [available, setAvailable] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);

  // Requests state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestFilter, setRequestFilter] = useState("ALL"); // ALL, PENDING, ACCEPTED, COMPLETED

  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("🌿");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Modal / Response state
  const [respondModal, setRespondModal] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getAuthHeaders = useCallback(() => {
    const headers = { "Content-Type": "application/json" };
    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }
    return headers;
  }, [user]);

  // 1. Fetch Profile
  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/profile?email=${encodeURIComponent(user?.email || "")}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Could not load listener profile.");
      const data = await res.json();
      setProfile(data);
      setAvailable(data.available ?? true);
      setDisplayName(data.displayName || user?.name || "");
      setAvatar(data.avatar || "🌿");
      setBio(data.bio || "");
      setInterests(data.interests || "");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingProfile(false);
    }
  }, [user, getAuthHeaders]);

  // 2. Fetch Requests
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${API_BASE}/requests?email=${encodeURIComponent(user?.email || "")}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Could not load support requests.");
      const data = await res.json();
      setRequests(data || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingRequests(false);
    }
  }, [user, getAuthHeaders]);

  useEffect(() => {
    fetchProfile();
    fetchRequests();
  }, [fetchProfile, fetchRequests]);

  // Toggle Availability
  const handleToggleAvailability = async (newVal) => {
    setTogglingAvail(true);
    try {
      const res = await fetch(`${API_BASE}/availability`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: user?.email, available: newVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update availability.");

      setAvailable(data.available);
      showToast(data.message);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setTogglingAvail(false);
    }
  };

  // Update Request Status (Accept, Reject, Complete)
  const handleUpdateStatus = async (requestId, status) => {
    try {
      const res = await fetch(`${API_BASE}/requests/${requestId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: user?.email, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update request.");

      showToast(data.message);
      fetchRequests();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setConfirmDialog(null);
    }
  };

  // Submit Response / Reply
  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!respondModal || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`${API_BASE}/requests/${respondModal.id}/respond`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: user?.email, responseMessage: replyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reply.");

      showToast("Supportive reply sent to student.");
      setRespondModal(null);
      setReplyText("");
      fetchRequests();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSendingReply(false);
    }
  };

  // Save Profile Form
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast("Display name cannot be empty.", "error");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: user?.email,
          displayName: displayName.trim(),
          avatar,
          bio: bio.trim(),
          interests: interests.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile.");

      showToast("Profile settings updated successfully.");
      setProfile((prev) => ({ ...prev, ...data }));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const acceptedCount = requests.filter((r) => r.status === "ACCEPTED").length;
  const completedCount = requests.filter((r) => r.status === "COMPLETED").length;

  const filteredRequests = requests.filter((r) => {
    if (requestFilter === "ALL") return true;
    return r.status === requestFilter;
  });

  return (
    <div className="listener-layout">
      {/* Toast Notification */}
      {toast && (
        <div className={`listener-toast ${toast.type === "error" ? "listener-toast-error" : "listener-toast-success"}`}>
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="listener-modal-backdrop">
          <div className="listener-modal">
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="listener-modal-actions">
              <button
                type="button"
                className="listener-btn listener-btn-secondary"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`listener-btn ${confirmDialog.danger ? "listener-btn-danger" : "listener-btn-primary"}`}
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {respondModal && (
        <div className="listener-modal-backdrop">
          <div className="listener-modal">
            <h3>Reply to {respondModal.studentName}</h3>
            <p style={{ margin: "4px 0 12px", fontSize: "12px", color: "#6a7f71" }}>
              Topic: <strong>{respondModal.topic}</strong>
            </p>
            <div style={{ background: "#f8faf8", padding: "12px", borderRadius: "8px", border: "1px solid #e7eee8", marginBottom: "16px", fontSize: "12px", fontStyle: "italic", color: "#485f4e" }}>
              "{respondModal.message}"
            </div>

            <form onSubmit={handleSendResponse}>
              <div className="listener-form-group">
                <label htmlFor="listenerReplyInput">Your Supportive Message</label>
                <textarea
                  id="listenerReplyInput"
                  className="listener-textarea"
                  rows={5}
                  placeholder="Share a thoughtful, empathetic response. Remind them they are not alone..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                />
              </div>

              <div className="listener-modal-actions">
                <button
                  type="button"
                  className="listener-btn listener-btn-secondary"
                  onClick={() => { setRespondModal(null); setReplyText(""); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="listener-btn listener-btn-primary"
                  disabled={sendingReply}
                >
                  {sendingReply ? "Sending..." : "Send Supportive Reply ♡"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="listener-header">
        <div className="listener-topbar">
          <div className="listener-brand">
            <span className="listener-brand-icon">💚</span>
            <div>
              <span>MindEase</span>
              <span className="listener-brand-tag">Peer Listener Space</span>
            </div>
          </div>

          <div className="listener-topbar-right">
            {/* Real Backend Availability Toggle */}
            <div className="listener-avail-wrap">
              <span className={`listener-status-dot ${available ? "online" : "offline"}`} />
              <span className="listener-avail-label">
                {available ? "Available to Listen" : "Away / Inactive"}
              </span>
              <label className="listener-switch">
                <input
                  type="checkbox"
                  checked={available}
                  disabled={togglingAvail}
                  onChange={(e) => handleToggleAvailability(e.target.checked)}
                />
                <span className="listener-slider" />
              </label>
            </div>

            <button type="button" className="listener-btn-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="listener-nav-bar">
          <div className="listener-nav-inner">
            <button
              type="button"
              className={`listener-nav-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              📊 Overview & Health
            </button>
            <button
              type="button"
              className={`listener-nav-btn ${activeTab === "requests" ? "active" : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              📥 Support Requests
              {pendingCount > 0 && <span className="listener-nav-pill">{pendingCount}</span>}
            </button>
            <button
              type="button"
              className={`listener-nav-btn ${activeTab === "sessions" ? "active" : ""}`}
              onClick={() => setActiveTab("sessions")}
            >
              💬 Active & Past Sessions ({acceptedCount + completedCount})
            </button>
            <button
              type="button"
              className={`listener-nav-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              ⚙️ My Profile & Topics
            </button>
          </div>
        </div>

        {/* Confidentiality & Ethics Reminder Banner */}
        <div className="listener-confidentiality-banner">
          <div className="listener-confidentiality-inner">
            <span className="listener-confidentiality-icon">🛡️</span>
            <div>
              <strong>Confidential & Empathetic Peer Support:</strong> As a peer listener, you provide a non-judgmental space to listen. You are not a licensed therapist. Always respect student privacy — individual student journals, mood entries, and future letters are strictly confidential and inaccessible.
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="listener-main">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <>
            <div className="listener-hero">
              <div className="listener-hero-text">
                <h1>Welcome back, {displayName || user?.name || "Peer Listener"} 🌿</h1>
                <p>
                  Thank you for holding space for fellow students. Small moments of non-judgmental listening make a world of difference.
                </p>
              </div>

              <div className="listener-hero-profile">
                <div className="listener-hero-avatar">{avatar}</div>
                <div className="listener-hero-info">
                  <h3>{displayName}</h3>
                  <p>{profile?.approvalStatus || "Approved"} Listener</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="listener-stats-grid">
              <div className="listener-stat-card">
                <div className="listener-stat-icon amber">⏳</div>
                <div>
                  <div className="listener-stat-val">{pendingCount}</div>
                  <div className="listener-stat-label">Pending Support Requests</div>
                </div>
              </div>

              <div className="listener-stat-card">
                <div className="listener-stat-icon teal">💬</div>
                <div>
                  <div className="listener-stat-val">{acceptedCount}</div>
                  <div className="listener-stat-label">Active Conversations</div>
                </div>
              </div>

              <div className="listener-stat-card">
                <div className="listener-stat-icon sage">✨</div>
                <div>
                  <div className="listener-stat-val">{completedCount}</div>
                  <div className="listener-stat-label">Completed Sessions</div>
                </div>
              </div>

              <div className="listener-stat-card">
                <div className="listener-stat-icon sage">{available ? "🟢" : "⚪"}</div>
                <div>
                  <div className="listener-stat-val">{available ? "Online" : "Away"}</div>
                  <div className="listener-stat-label">Live Availability</div>
                </div>
              </div>
            </div>

            {/* Quick Shortcuts */}
            <div className="listener-card">
              <div className="listener-card-header">
                <div>
                  <h2>Quick Shortcuts</h2>
                  <p>Common actions for your peer listener shift</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="listener-btn listener-btn-primary"
                  onClick={() => setActiveTab("requests")}
                >
                  📥 Review Support Requests ({pendingCount} pending)
                </button>
                <button
                  type="button"
                  className="listener-btn listener-btn-secondary"
                  onClick={() => setActiveTab("profile")}
                >
                  ⚙️ Update Bio & Focus Topics
                </button>
                <button
                  type="button"
                  className="listener-btn listener-btn-secondary"
                  onClick={() => {
                    fetchRequests();
                    fetchProfile();
                    showToast("Workspace refreshed.");
                  }}
                >
                  ↻ Refresh Requests Queue
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: SUPPORT REQUESTS */}
        {activeTab === "requests" && (
          <div className="listener-card">
            <div className="listener-card-header">
              <div>
                <h2>Incoming Student Requests ({filteredRequests.length})</h2>
                <p>Genuine support requests assigned to you</p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {["ALL", "PENDING", "ACCEPTED", "COMPLETED"].map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    className={`listener-btn listener-btn-sm ${requestFilter === cat ? "listener-btn-primary" : "listener-btn-secondary"}`}
                    onClick={() => setRequestFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loadingRequests ? (
              <div className="listener-empty">
                <p>Loading support requests from server...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="listener-empty">
                <div className="listener-empty-icon">🌱</div>
                <h3>No requests in this view</h3>
                <p>When students reach out for peer support, their requests will appear right here.</p>
              </div>
            ) : (
              <div className="listener-requests-list">
                {filteredRequests.map((req) => (
                  <div className="listener-request-item" key={req.id}>
                    <div className="listener-request-top">
                      <div className="listener-student-info">
                        <div className="listener-student-avatar">
                          {req.studentName ? req.studentName[0].toUpperCase() : "S"}
                        </div>
                        <div>
                          <span className="listener-student-name">{req.studentName}</span>
                          <span className="listener-request-topic">{req.topic}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className={`listener-badge listener-badge-${req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                        <span className="listener-request-time">
                          {new Date(req.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="listener-request-msg">
                      "{req.message || "No specific message attached."}"
                    </div>

                    {req.responseMessage && (
                      <div className="listener-response-msg">
                        <strong>Your reply:</strong>
                        "{req.responseMessage}"
                      </div>
                    )}

                    <div className="listener-request-actions">
                      {req.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            className="listener-btn listener-btn-success listener-btn-sm"
                            onClick={() => {
                              setRespondModal(req);
                              setReplyText("Hi " + req.studentName + ", thank you for reaching out. I'm here to listen. Take your time to share whatever you'd like.");
                            }}
                          >
                            ✓ Accept & Reply
                          </button>
                          <button
                            type="button"
                            className="listener-btn listener-btn-danger listener-btn-sm"
                            onClick={() => {
                              setConfirmDialog({
                                title: "Decline Support Request",
                                message: `Are you sure you want to decline this request from ${req.studentName}?`,
                                danger: true,
                                confirmText: "Decline",
                                onConfirm: () => handleUpdateStatus(req.id, "REJECTED"),
                              });
                            }}
                          >
                            ✕ Decline
                          </button>
                        </>
                      )}

                      {req.status === "ACCEPTED" && (
                        <>
                          <button
                            type="button"
                            className="listener-btn listener-btn-primary listener-btn-sm"
                            onClick={() => {
                              setRespondModal(req);
                              setReplyText(req.responseMessage || "");
                            }}
                          >
                            💬 Send Message / Reply
                          </button>
                          <button
                            type="button"
                            className="listener-btn listener-btn-secondary listener-btn-sm"
                            onClick={() => handleUpdateStatus(req.id, "COMPLETED")}
                          >
                            ✓ Mark Session as Completed
                          </button>
                        </>
                      )}

                      {req.status === "COMPLETED" && (
                        <span style={{ fontSize: "11px", color: "#166534", fontWeight: "600" }}>
                          ✓ Session completed and archived
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SESSIONS & CONVERSATION HISTORY */}
        {activeTab === "sessions" && (
          <div className="listener-card">
            <div className="listener-card-header">
              <div>
                <h2>Active Conversations & Session Records</h2>
                <p>Support conversations you have accepted or completed</p>
              </div>
            </div>

            {requests.filter((r) => ["ACCEPTED", "COMPLETED"].includes(r.status)).length === 0 ? (
              <div className="listener-empty">
                <div className="listener-empty-icon">💬</div>
                <h3>No ongoing or completed sessions</h3>
                <p>Accept an incoming student support request to begin a conversation.</p>
              </div>
            ) : (
              <div className="listener-requests-list">
                {requests
                  .filter((r) => ["ACCEPTED", "COMPLETED"].includes(r.status))
                  .map((session) => (
                    <div className="listener-request-item" key={session.id}>
                      <div className="listener-request-top">
                        <div className="listener-student-info">
                          <div className="listener-student-avatar">
                            {session.studentName ? session.studentName[0].toUpperCase() : "S"}
                          </div>
                          <div>
                            <span className="listener-student-name">{session.studentName}</span>
                            <span className="listener-request-topic">{session.topic}</span>
                          </div>
                        </div>

                        <span className={`listener-badge listener-badge-${session.status.toLowerCase()}`}>
                          {session.status}
                        </span>
                      </div>

                      <div className="listener-request-msg">
                        <strong>Student:</strong> "{session.message}"
                      </div>

                      {session.responseMessage ? (
                        <div className="listener-response-msg">
                          <strong>Your response:</strong> "{session.responseMessage}"
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "#8a9c8f", fontStyle: "italic" }}>
                          No message reply recorded yet.
                        </div>
                      )}

                      <div className="listener-request-actions">
                        {session.status === "ACCEPTED" ? (
                          <>
                            <button
                              type="button"
                              className="listener-btn listener-btn-primary listener-btn-sm"
                              onClick={() => {
                                setRespondModal(session);
                                setReplyText(session.responseMessage || "");
                              }}
                            >
                              Write / Update Reply
                            </button>
                            <button
                              type="button"
                              className="listener-btn listener-btn-secondary listener-btn-sm"
                              onClick={() => handleUpdateStatus(session.id, "COMPLETED")}
                            >
                              Complete Session
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#506956" }}>
                            Session closed on {new Date(session.updatedAt || session.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE SETTINGS */}
        {activeTab === "profile" && (
          <div className="listener-card">
            <div className="listener-card-header">
              <div>
                <h2>Peer Listener Profile & Topic Focus</h2>
                <p>Customize how you appear to students seeking peer support</p>
              </div>
            </div>

            {loadingProfile ? (
              <p>Loading your profile...</p>
            ) : (
              <form className="listener-form" onSubmit={handleSaveProfile}>
                <div className="listener-form-group">
                  <label>Choose Your Avatar Emoji</label>
                  <div className="listener-avatar-picker">
                    {AVATAR_OPTIONS.map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        className={`listener-avatar-opt ${avatar === opt ? "chosen" : ""}`}
                        onClick={() => setAvatar(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="listener-form-group">
                  <label htmlFor="listenerDisplayName">Public Display Name</label>
                  <input
                    id="listenerDisplayName"
                    type="text"
                    className="listener-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Ananya S."
                    maxLength={100}
                    required
                  />
                </div>

                <div className="listener-form-group">
                  <label htmlFor="listenerBio">About You / Supporting Philosophy</label>
                  <textarea
                    id="listenerBio"
                    className="listener-textarea"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share a short, warm introduction explaining your perspective on listening..."
                  />
                </div>

                <div className="listener-form-group">
                  <label htmlFor="listenerInterests">Focus Areas / Support Topics</label>
                  <input
                    id="listenerInterests"
                    type="text"
                    className="listener-input"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g. Stress, Friendships, Study habits, Motivation"
                  />
                </div>

                <div className="listener-form-group">
                  <label>Approval Status</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="listener-badge listener-badge-completed">
                      {profile?.approvalStatus || "APPROVED"}
                    </span>
                    <span style={{ fontSize: "11px", color: "#6a7f71" }}>
                      Verified Peer Listener account
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "12px" }}>
                  <button
                    type="submit"
                    className="listener-btn listener-btn-primary"
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving Changes..." : "Save Profile Settings"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
