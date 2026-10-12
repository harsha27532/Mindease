import { useState, useEffect, useCallback } from "react";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:8080/api/admin";

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, listeners, monitoring
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Users Tab State
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Listeners Tab State
  const [listeners, setListeners] = useState([]);
  const [listenerFilter, setListenerFilter] = useState("ALL");
  const [loadingListeners, setLoadingListeners] = useState(false);

  // Monitoring Tab State
  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // UI / Dialogs State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewUserModal, setViewUserModal] = useState(null);

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

  // 1. Fetch Overview Stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/stats`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load statistics.");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      showToast(err.message || "Could not connect to server.", "error");
    } finally {
      setLoadingStats(false);
    }
  }, [getAuthHeaders]);

  // 2. Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        role: roleFilter,
        status: statusFilter,
        page: page.toString(),
        size: "8",
      });
      const res = await fetch(`${API_BASE}/users?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load users list.");
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(data.totalElements || 0);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingUsers(false);
    }
  }, [searchQuery, roleFilter, statusFilter, page, getAuthHeaders]);

  // 3. Fetch Listeners
  const fetchListeners = useCallback(async () => {
    setLoadingListeners(true);
    try {
      const res = await fetch(`${API_BASE}/listeners`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load listeners.");
      const data = await res.json();
      setListeners(data || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingListeners(false);
    }
  }, [getAuthHeaders]);

  // 4. Fetch Activity
  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const res = await fetch(`${API_BASE}/activity`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load activity logs.");
      const data = await res.json();
      setActivities(data || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingActivity(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "listeners") fetchListeners();
    if (activeTab === "monitoring") fetchActivity();
  }, [activeTab, fetchUsers, fetchListeners, fetchActivity]);

  // User Actions
  const handleToggleUserStatus = async (targetUser) => {
    if (targetUser.email === user.email) {
      showToast("You cannot deactivate your own administrator account.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/${targetUser.id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update user status.");

      showToast(data.message || "User status updated successfully.");
      fetchUsers();
      fetchStats();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setConfirmDialog(null);
    }
  };

  // Listener Actions
  const handleApproveListener = async (profileId) => {
    try {
      const res = await fetch(`${API_BASE}/listeners/${profileId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve listener.");

      showToast("Listener application approved.");
      fetchListeners();
      fetchStats();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleRejectListener = async () => {
    if (!rejectDialog) return;
    try {
      const res = await fetch(`${API_BASE}/listeners/${rejectDialog.id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "REJECTED", reason: rejectReason || "Application criteria not met." }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject listener.");

      showToast("Listener application rejected.");
      fetchListeners();
      fetchStats();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRejectDialog(null);
      setRejectReason("");
    }
  };

  const filteredListeners = listeners.filter((item) => {
    if (listenerFilter === "APPROVED") return item.approvalStatus === "APPROVED";
    if (listenerFilter === "PENDING") return item.approvalStatus === "PENDING";
    if (listenerFilter === "REJECTED") return item.approvalStatus === "REJECTED";
    if (listenerFilter === "AVAILABLE") return item.available && item.approvalStatus === "APPROVED";
    return true;
  });

  return (
    <div className="admin-layout">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast ${toast.type === "error" ? "admin-toast-error" : "admin-toast-success"}`}>
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-btn ${confirmDialog.danger ? "admin-btn-danger" : "admin-btn-primary"}`}
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectDialog && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h3>Reject Application</h3>
            <p>Please provide a constructive note explaining the rejection for <strong>{rejectDialog.displayName}</strong>:</p>
            <textarea
              style={{ width: "100%", height: "80px", padding: "10px", borderRadius: "8px", border: "1px solid #d8e4da", fontSize: "12px", marginBottom: "16px" }}
              placeholder="e.g. Please complete peer listener training session first."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => { setRejectDialog(null); setRejectReason(""); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleRejectListener}
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewUserModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h3>User Account Profile</h3>
            <div style={{ marginTop: "12px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div><strong>Name:</strong> {viewUserModal.name}</div>
              <div><strong>Email:</strong> {viewUserModal.email}</div>
              <div><strong>Role:</strong> <span className={`admin-badge admin-badge-${viewUserModal.role.toLowerCase()}`}>{viewUserModal.role}</span></div>
              <div><strong>Status:</strong> <span className={`admin-badge ${viewUserModal.active ? "admin-badge-active" : "admin-badge-inactive"}`}>{viewUserModal.active ? "Active" : "Inactive"}</span></div>
              <div><strong>Joined:</strong> {new Date(viewUserModal.createdAt).toLocaleString()}</div>
            </div>
            <div className="admin-modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setViewUserModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "admin-open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <span className="admin-brand-icon">🛡️</span>
            <div>
              <span>MindEase</span>
              <span className="admin-brand-badge" style={{ marginLeft: "8px" }}>Admin</span>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === "overview" ? "admin-active" : ""}`}
            onClick={() => { setActiveTab("overview"); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-icon">📊</span>
            <span>Dashboard Overview</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === "users" ? "admin-active" : ""}`}
            onClick={() => { setActiveTab("users"); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-icon">👥</span>
            <span>User Management</span>
            {stats?.totalUsers > 0 && <span className="admin-nav-badge">{stats.totalUsers}</span>}
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === "listeners" ? "admin-active" : ""}`}
            onClick={() => { setActiveTab("listeners"); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-icon">🌿</span>
            <span>Peer Listeners</span>
            {stats?.pendingApplications > 0 && (
              <span className="admin-nav-badge" style={{ background: "#fef3c7", color: "#b45309" }}>
                {stats.pendingApplications} new
              </span>
            )}
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === "monitoring" ? "admin-active" : ""}`}
            onClick={() => { setActiveTab("monitoring"); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-icon">📈</span>
            <span>Platform Activity</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-system-health">
            <span className="admin-health-dot" />
            <span>Backend API: Operational</span>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            style={{ width: "100%" }}
            onClick={onLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Navigation Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              ☰
            </button>
            <div className="admin-page-title">
              <h1>
                {activeTab === "overview" && "Platform Operations & Analytics"}
                {activeTab === "users" && "User Directory & Access Control"}
                {activeTab === "listeners" && "Peer Listener Team & Applications"}
                {activeTab === "monitoring" && "Platform Activity Audit"}
              </h1>
              <p>MindEase Mental Wellness Management Console</p>
            </div>
          </div>

          <div className="admin-topbar-right">
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => {
                fetchStats();
                if (activeTab === "users") fetchUsers();
                if (activeTab === "listeners") fetchListeners();
                if (activeTab === "monitoring") fetchActivity();
                showToast("Data refreshed from backend.");
              }}
              title="Refresh Data"
            >
              ↻ Refresh
            </button>

            <div className="admin-user-pill">
              <div className="admin-user-avatar">
                {user?.name ? user.name[0].toUpperCase() : "A"}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name">{user?.name || "Administrator"}</span>
                <span className="admin-user-role">System Admin</span>
              </div>
            </div>

            <button type="button" className="admin-btn-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="admin-content">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
              {/* Metric KPI Cards */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Total Registered Users</span>
                    <span className="admin-stat-icon sage">👥</span>
                  </div>
                  <div className="admin-stat-val">
                    {loadingStats ? "..." : stats?.totalUsers ?? 0}
                  </div>
                  <span className="admin-stat-sub">Across all student and listener accounts</span>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Students Supported</span>
                    <span className="admin-stat-icon teal">🎓</span>
                  </div>
                  <div className="admin-stat-val">
                    {loadingStats ? "..." : stats?.studentCount ?? 0}
                  </div>
                  <span className="admin-stat-sub">Active wellness journeys</span>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Peer Listeners</span>
                    <span className="admin-stat-icon lavender">💚</span>
                  </div>
                  <div className="admin-stat-val">
                    {loadingStats ? "..." : stats?.listenerCount ?? 0}
                  </div>
                  <span className="admin-stat-sub">
                    {stats?.activeListeners ?? 0} currently available for support
                  </span>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Pending Applications</span>
                    <span className="admin-stat-icon amber">⏳</span>
                  </div>
                  <div className="admin-stat-val">
                    {loadingStats ? "..." : stats?.pendingApplications ?? 0}
                  </div>
                  <span className="admin-stat-sub">Awaiting admin review</span>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Support Sessions</span>
                    <span className="admin-stat-icon teal">💬</span>
                  </div>
                  <div className="admin-stat-val">
                    {loadingStats ? "..." : stats?.totalRequests ?? 0}
                  </div>
                  <span className="admin-stat-sub">
                    {stats?.completedSessions ?? 0} completed · {stats?.pendingRequests ?? 0} pending
                  </span>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Wellness Engagements</span>
                    <span className="admin-stat-icon sage">✨</span>
                  </div>
                  <div className="admin-stat-val">
                    {loadingStats ? "..." : (stats?.totalMoodEntries ?? 0) + (stats?.totalTinyWins ?? 0)}
                  </div>
                  <span className="admin-stat-sub">
                    {stats?.totalMoodEntries ?? 0} mood check-ins · {stats?.totalTinyWins ?? 0} tiny wins
                  </span>
                </div>
              </div>

              {/* Quick Actions & Shortcut Banner */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2>Administrative Shortcuts</h2>
                    <p>Direct access to common operational workflows</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => setActiveTab("users")}
                  >
                    👥 Manage Registered Users
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setActiveTab("listeners")}
                  >
                    🌿 Review Peer Listeners & Approvals
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setActiveTab("monitoring")}
                  >
                    📈 View Real-Time Activity Log
                  </button>
                </div>
              </div>

              {/* System Architecture Status */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2>Platform Health & Data Infrastructure</h2>
                    <p>Live health status of integrated platform services</p>
                  </div>
                  <span className="admin-badge admin-badge-active">● All Systems Operational</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                  <div style={{ background: "#f8faf8", padding: "14px", borderRadius: "10px", border: "1px solid #edf2ee" }}>
                    <div style={{ fontSize: "11px", color: "#6a7d70", fontWeight: "700" }}>DATABASE</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#24382c", marginTop: "4px" }}>MySQL 8.0 (Active)</div>
                    <div style={{ fontSize: "11px", color: "#8a9c90", marginTop: "2px" }}>mindease schema connected</div>
                  </div>
                  <div style={{ background: "#f8faf8", padding: "14px", borderRadius: "10px", border: "1px solid #edf2ee" }}>
                    <div style={{ fontSize: "11px", color: "#6a7d70", fontWeight: "700" }}>API BACKEND</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#24382c", marginTop: "4px" }}>Spring Boot 3.3.4</div>
                    <div style={{ fontSize: "11px", color: "#8a9c90", marginTop: "2px" }}>Port 8080 · JWT Enabled</div>
                  </div>
                  <div style={{ background: "#f8faf8", padding: "14px", borderRadius: "10px", border: "1px solid #edf2ee" }}>
                    <div style={{ fontSize: "11px", color: "#6a7d70", fontWeight: "700" }}>STUDENT PRIVACY</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#24382c", marginTop: "4px" }}>Protected & Isolated</div>
                    <div style={{ fontSize: "11px", color: "#8a9c90", marginTop: "2px" }}>Journals & letters kept strictly private</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === "users" && (
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h2>User Directory ({totalUsers})</h2>
                  <p>Search, filter, and manage access permissions for registered accounts</p>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by name or email address..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                  />
                </div>

                <select
                  className="admin-select"
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
                  aria-label="Filter by role"
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="LISTENER">Peer Listeners</option>
                  <option value="ADMIN">Administrators</option>
                </select>

                <select
                  className="admin-select"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                  aria-label="Filter by status"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Accounts</option>
                  <option value="INACTIVE">Deactivated Accounts</option>
                </select>
              </div>

              {/* Table */}
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Account Status</th>
                      <th>Registered On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#778b7d" }}>
                          Loading user directory...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#778b7d" }}>
                          No users found matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      users.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  background: "#edf4ee",
                                  color: "#355a43",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "700",
                                  fontSize: "12px",
                                }}
                              >
                                {item.name ? item.name[0].toUpperCase() : "U"}
                              </div>
                              <div>
                                <div style={{ fontWeight: "700", color: "#22382a" }}>{item.name}</div>
                                <div style={{ fontSize: "11px", color: "#728578" }}>{item.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`admin-badge admin-badge-${item.role.toLowerCase()}`}>
                              {item.role === "LISTENER" ? "Peer Listener" : item.role}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-badge ${item.active ? "admin-badge-active" : "admin-badge-inactive"}`}>
                              {item.active ? "● Active" : "○ Inactive"}
                            </span>
                          </td>
                          <td style={{ color: "#6a7d70", fontSize: "11px" }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                                onClick={() => setViewUserModal(item)}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className={`admin-btn admin-btn-sm ${item.active ? "admin-btn-danger" : "admin-btn-success"}`}
                                disabled={item.email === user.email}
                                onClick={() => {
                                  setConfirmDialog({
                                    title: item.active ? "Deactivate User Account" : "Activate User Account",
                                    message: `Are you sure you want to ${item.active ? "deactivate" : "activate"} ${item.name} (${item.email})?`,
                                    danger: item.active,
                                    confirmText: item.active ? "Deactivate" : "Activate",
                                    onConfirm: () => handleToggleUserStatus(item),
                                  });
                                }}
                              >
                                {item.active ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="admin-pagination">
                <span>
                  Showing {users.length} of {totalUsers} total users
                </span>
                <div className="admin-page-btns">
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    ← Previous
                  </button>
                  <span style={{ display: "flex", alignItems: "center", padding: "0 8px" }}>
                    Page {page + 1} of {Math.max(1, totalPages)}
                  </span>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PEER LISTENER MANAGEMENT */}
          {activeTab === "listeners" && (
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h2>Peer Listener Network ({filteredListeners.length})</h2>
                  <p>Approve applications, verify qualifications, and manage active listener availability</p>
                </div>

                <div className="admin-card-actions">
                  <select
                    className="admin-select"
                    value={listenerFilter}
                    onChange={(e) => setListenerFilter(e.target.value)}
                    aria-label="Filter listeners"
                  >
                    <option value="ALL">All Listeners ({listeners.length})</option>
                    <option value="PENDING">Pending Approval ({listeners.filter(l => l.approvalStatus === "PENDING").length})</option>
                    <option value="APPROVED">Approved ({listeners.filter(l => l.approvalStatus === "APPROVED").length})</option>
                    <option value="AVAILABLE">Currently Available Now</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {loadingListeners ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#6a7e70" }}>
                  Loading peer listeners...
                </div>
              ) : filteredListeners.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#6a7e70" }}>
                  No peer listeners found matching this filter.
                </div>
              ) : (
                <div className="admin-listeners-grid">
                  {filteredListeners.map((item) => (
                    <div className="admin-listener-card" key={item.id}>
                      <div className="admin-listener-header">
                        <div className="admin-listener-avatar">{item.avatar || "🌿"}</div>
                        <div className="admin-listener-info">
                          <h3>{item.displayName || item.name}</h3>
                          <p>{item.email}</p>
                        </div>
                      </div>

                      <div className="admin-listener-meta">
                        <span className={`admin-badge admin-badge-${(item.approvalStatus || "approved").toLowerCase()}`}>
                          {item.approvalStatus || "APPROVED"}
                        </span>
                        <span className={`admin-badge ${item.available ? "admin-badge-active" : "admin-badge-inactive"}`}>
                          {item.available ? "Available to Listen" : "Unavailable"}
                        </span>
                        <span className={`admin-badge ${item.userActive ? "admin-badge-active" : "admin-badge-inactive"}`}>
                          Account: {item.userActive ? "Active" : "Disabled"}
                        </span>
                      </div>

                      <div className="admin-listener-bio">
                        "{item.bio || "No biography provided yet."}"
                      </div>

                      {item.interests && (
                        <div style={{ fontSize: "11px", color: "#6c8072" }}>
                          <strong>Topics:</strong> {item.interests}
                        </div>
                      )}

                      {item.rejectionReason && (
                        <div style={{ fontSize: "11px", color: "#b91c1c", background: "#fef2f2", padding: "8px", borderRadius: "6px" }}>
                          <strong>Rejection reason:</strong> {item.rejectionReason}
                        </div>
                      )}

                      <div className="admin-listener-actions">
                        {item.approvalStatus !== "APPROVED" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-success admin-btn-sm"
                            onClick={() => handleApproveListener(item.id)}
                          >
                            ✓ Approve
                          </button>
                        )}

                        {item.approvalStatus !== "REJECTED" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => setRejectDialog(item)}
                          >
                            ✕ Reject
                          </button>
                        )}

                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          style={{ marginLeft: "auto" }}
                          onClick={() => setViewUserModal({
                            name: item.displayName || item.name,
                            email: item.email,
                            role: "LISTENER",
                            active: item.userActive,
                            createdAt: item.createdAt,
                          })}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PLATFORM MONITORING */}
          {activeTab === "monitoring" && (
            <>
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2>Support Request Workflows</h2>
                    <p>Status of peer-to-peer student support requests across the platform</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "16px", background: "#fef3c7", borderRadius: "12px", border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#92400e" }}>Pending Assignment</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#78350f", marginTop: "4px" }}>
                      {stats?.pendingRequests ?? 0}
                    </div>
                  </div>
                  <div style={{ padding: "16px", background: "#e0f2fe", borderRadius: "12px", border: "1px solid #bae6fd" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#075985" }}>In Progress (Accepted)</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#0369a1", marginTop: "4px" }}>
                      {stats?.acceptedRequests ?? 0}
                    </div>
                  </div>
                  <div style={{ padding: "16px", background: "#dcfce7", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#166534" }}>Completed Sessions</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#15803d", marginTop: "4px" }}>
                      {stats?.completedSessions ?? 0}
                    </div>
                  </div>
                  <div style={{ padding: "16px", background: "#f1f5f9", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Total Lifetime Requests</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#334155", marginTop: "4px" }}>
                      {stats?.totalRequests ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2>Real-Time Audit & Activity Log</h2>
                    <p>Live stream of verified platform events, registrations, and support updates</p>
                  </div>
                </div>

                {loadingActivity ? (
                  <div style={{ textAlign: "center", padding: "30px", color: "#6e8274" }}>
                    Loading live activity...
                  </div>
                ) : activities.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px", color: "#6e8274" }}>
                    No recent activity recorded yet.
                  </div>
                ) : (
                  <div className="admin-activity-list">
                    {activities.map((item) => (
                      <div className="admin-activity-item" key={item.id}>
                        <div className="admin-activity-icon">
                          {item.type === "USER_REGISTRATION" ? "👤" : "💬"}
                        </div>
                        <div className="admin-activity-content">
                          <p className="admin-activity-desc">{item.description}</p>
                          <p className="admin-activity-time">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className="admin-badge admin-badge-active">
                          {item.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
