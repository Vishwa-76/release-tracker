import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #111118;
    --surface2: #1a1a24;
    --border: #ffffff10;
    --border-hover: #ffffff22;
    --accent: #6c63ff;
    --accent2: #ff6584;
    --accent3: #43e97b;
    --text: #e8e8f0;
    --text-muted: #6b6b80;
    --text-dim: #3a3a4a;
    --success: #43e97b;
    --fail: #ff6584;
    --warn: #ffd166;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --radius: 12px;
    --shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-display);
    min-height: 100vh;
    overflow-x: hidden;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(108,99,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(108,99,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .app-wrapper { position: relative; z-index: 1; display: flex; min-height: 100vh; }

  .sidebar {
    width: 240px;
    min-height: 100vh;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 28px 20px;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 36px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }

  .logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    box-shadow: 0 0 20px rgba(108,99,255,0.4);
  }

  .logo-text { font-size: 15px; font-weight: 700; letter-spacing: -0.3px; line-height: 1.2; }
  .logo-sub { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); letter-spacing: 1px; }

  .nav-label {
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--text-dim);
    font-family: var(--font-mono);
    margin-bottom: 10px;
    margin-left: 12px;
    text-transform: uppercase;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    margin-bottom: 4px;
    border: 1px solid transparent;
  }

  .nav-item:hover { background: var(--surface2); color: var(--text); border-color: var(--border); }

  .nav-item.active {
    background: rgba(108,99,255,0.12);
    color: var(--accent);
    border-color: rgba(108,99,255,0.25);
  }

  .nav-icon { font-size: 16px; width: 20px; text-align: center; }

  .sidebar-footer {
    margin-top: auto;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--text-dim);
    font-family: var(--font-mono);
    line-height: 1.9;
  }

  .status-dot {
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--success);
    margin-right: 6px;
    box-shadow: 0 0 6px var(--success);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  .main { margin-left: 240px; padding: 40px 44px; min-height: 100vh; }

  .page-header {
    margin-bottom: 32px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  .page-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .page-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 4px; font-family: var(--font-mono); letter-spacing: 0.5px; }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 22px;
    transition: border-color 0.2s, transform 0.2s;
  }

  .stat-card:hover { border-color: var(--border-hover); transform: translateY(-1px); }

  .stat-label { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
  .stat-value { font-size: 32px; font-weight: 800; letter-spacing: -1.5px; font-family: var(--font-mono); }
  .stat-sub { font-size: 11px; color: var(--text-dim); margin-top: 4px; }

  .stat-card.green .stat-value { color: var(--success); }
  .stat-card.red .stat-value { color: var(--fail); }
  .stat-card.purple .stat-value { color: var(--accent); }
  .stat-card.yellow .stat-value { color: var(--warn); }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .card-header {
    padding: 16px 22px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title { font-size: 13px; font-weight: 600; letter-spacing: 0.2px; }

  .filter-tabs { display: flex; gap: 6px; }

  .filter-tab {
    padding: 5px 13px;
    border-radius: 7px;
    font-size: 11px;
    font-family: var(--font-mono);
    cursor: pointer;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    transition: all 0.15s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .filter-tab:hover { border-color: var(--border-hover); color: var(--text); }
  .filter-tab.active { background: rgba(108,99,255,0.15); border-color: rgba(108,99,255,0.35); color: var(--accent); }

  table { width: 100%; border-collapse: collapse; }

  thead th {
    padding: 11px 20px;
    text-align: left;
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-weight: 500;
    border-bottom: 1px solid var(--border);
    background: rgba(255,255,255,0.01);
  }

  tbody tr { border-bottom: 1px solid var(--border); transition: background 0.12s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: rgba(255,255,255,0.02); }

  td { padding: 13px 20px; font-size: 13px; color: var(--text); font-family: var(--font-mono); }
  td.name-cell { font-family: var(--font-display); font-weight: 500; font-size: 14px; }

  .version-badge {
    display: inline-block;
    padding: 3px 9px;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 12px;
    font-family: var(--font-mono);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 11px;
    border-radius: 20px;
    font-size: 11px;
    font-family: var(--font-mono);
    font-weight: 500;
    letter-spacing: 0.3px;
  }

  .status-badge::before {
    content: '';
    width: 5px; height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .sb-completed { background: rgba(67,233,123,0.1); border: 1px solid rgba(67,233,123,0.25); color: var(--success); }
  .sb-completed::before { background: var(--success); box-shadow: 0 0 5px var(--success); }

  .sb-failed { background: rgba(255,101,132,0.1); border: 1px solid rgba(255,101,132,0.25); color: var(--fail); }
  .sb-failed::before { background: var(--fail); }

  .sb-in-progress { background: rgba(255,209,102,0.1); border: 1px solid rgba(255,209,102,0.25); color: var(--warn); }
  .sb-in-progress::before { background: var(--warn); animation: pulse 1s infinite; }

  .sb-scheduled { background: rgba(108,99,255,0.1); border: 1px solid rgba(108,99,255,0.25); color: var(--accent); }
  .sb-scheduled::before { background: var(--accent); }

  .sb-none { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--text-muted); }
  .sb-none::before { background: var(--text-dim); }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-group.full { grid-column: 1 / -1; }

  label {
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  select, input[type="text"], input[type="datetime-local"] {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 12px 16px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
    appearance: none;
    -webkit-appearance: none;
  }

  select:focus, input:focus {
    border-color: rgba(108,99,255,0.5);
    box-shadow: 0 0 0 3px rgba(108,99,255,0.1);
  }

  select option { background: #1a1a24; }
  input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 26px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    font-family: var(--font-display);
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    letter-spacing: -0.2px;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%);
    color: white;
    box-shadow: 0 4px 20px rgba(108,99,255,0.35);
  }

  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(108,99,255,0.45); }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .btn-ghost {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { border-color: var(--border-hover); }

  .version-preview {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 18px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .warn-bar {
    background: rgba(255,209,102,0.08);
    border: 1px solid rgba(255,209,102,0.25);
    color: var(--warn);
    padding: 12px 16px;
    border-radius: 10px;
    font-family: var(--font-mono);
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .log-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 14px;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .log-card:hover { border-color: var(--border-hover); }

  .log-card-header {
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: rgba(255,255,255,0.01);
  }

  .log-version-flow { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; flex-wrap: wrap; }
  .flow-arrow { color: var(--text-dim); }
  .log-meta { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 4px; }

  .log-entries { padding: 0 20px; }

  .log-entry {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 12px;
  }

  .log-entry:last-child { border-bottom: none; }
  .log-time { color: var(--text-dim); min-width: 82px; flex-shrink: 0; }
  .log-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); margin-top: 5px; flex-shrink: 0; opacity: 0.6; }
  .log-msg { color: var(--text-muted); }

  .error-bar {
    background: rgba(255,101,132,0.08);
    border: 1px solid rgba(255,101,132,0.2);
    color: var(--fail);
    padding: 12px 16px;
    border-radius: 10px;
    font-family: var(--font-mono);
    font-size: 12px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .empty-state {
    text-align: center;
    padding: 64px 20px;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 13px;
  }

  .empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.3; }

  .refresh-info {
    font-size: 11px;
    color: var(--text-dim);
    font-family: var(--font-mono);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .toast {
    position: fixed;
    bottom: 28px; right: 28px;
    background: var(--surface);
    border: 1px solid rgba(67,233,123,0.3);
    color: var(--success);
    padding: 14px 20px;
    border-radius: 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    box-shadow: var(--shadow);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease;
    z-index: 999;
  }

  @keyframes slideIn {
    from { transform: translateY(16px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 4px; }

  .toggle-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--text-muted);
    font-family: var(--font-mono); cursor: pointer;
  }

  input[type="checkbox"] { width: 15px; height: 15px; accent-color: var(--accent); cursor: pointer; }

  .controls-bar {
    display: flex; gap: 12px; align-items: center; padding: 16px 20px;
    flex-wrap: wrap;
  }
`;

function getStatusClass(status) {
  if (!status) return "sb-none";
  if (status === "Completed") return "sb-completed";
  if (status === "Failed") return "sb-failed";
  if (status === "In Progress") return "sb-in-progress";
  if (status === "Scheduled") return "sb-scheduled";
  return "sb-none";
}

// ── helper: returns true if toVersion is same or lower than currentVersion ──
function isSameOrLower(toVersion, currentVersion) {
  const to = toVersion.split(".").map(Number);
  const cur = currentVersion.split(".").map(Number);
  for (let i = 0; i < to.length; i++) {
    if (to[i] > cur[i]) return false;
    if (to[i] < cur[i]) return true;
  }
  return true; // equal
}

function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return <div className="toast">✓ {message}</div>;
}

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const links = [
    { path: "/", icon: "◈", label: "Dashboard" },
    { path: "/scheduler", icon: "◷", label: "Schedule Upgrade" },
    { path: "/logs", icon: "≡", label: "Upgrade Logs" },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">↑</div>
        <div>
          <div className="logo-text">ReleaseTrack</div>
          <div className="logo-sub">UPGRADE MANAGER</div>
        </div>
      </div>
      <div className="nav-label">Navigation</div>
      {links.map(l => (
        <div key={l.path} className={`nav-item ${location.pathname === l.path ? "active" : ""}`} onClick={() => navigate(l.path)}>
          <span className="nav-icon">{l.icon}</span>
          {l.label}
        </div>
      ))}
      <div className="sidebar-footer">
        <span className="status-dot" />Backend connected<br />
        Auto-refresh · 5s interval<br />
        v1.0.0 · Internal Tool
      </div>
    </aside>
  );
}

function Dashboard() {
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  const fetchClients = async () => {
    try {
      const res = await fetch("http://localhost:5000/clients");
      if (!res.ok) throw new Error();
      setClients(await res.json());
      setError(null);
    } catch { setError("Cannot connect to backend server."); }
  };

  useEffect(() => {
    fetchClients();
    const i = setInterval(fetchClients, 5000);
    return () => clearInterval(i);
  }, []);

  const filtered = clients.filter(c => {
    if (filter === "all") return true;
    const last = c.upgrades.at(-1);
    if (!last) return false;
    if (filter === "success") return last.status === "Completed";
    if (filter === "failed") return last.status === "Failed";
    if (filter === "active") return last.status === "In Progress" || last.status === "Scheduled";
    return true;
  });

  const total = clients.length;
  const success = clients.filter(c => c.upgrades.at(-1)?.status === "Completed").length;
  const failed = clients.filter(c => c.upgrades.at(-1)?.status === "Failed").length;
  const active = clients.filter(c => { const s = c.upgrades.at(-1)?.status; return s === "In Progress" || s === "Scheduled"; }).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">All clients · live status</div>
        </div>
        <div className="refresh-info"><span className="status-dot" />Live · refreshing every 5s</div>
      </div>

      {error && <div className="error-bar">⚠ {error}</div>}

      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-label">Total Clients</div>
          <div className="stat-value">{total}</div>
          <div className="stat-sub">registered</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Successful</div>
          <div className="stat-value">{success}</div>
          <div className="stat-sub">upgrades completed</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Failed</div>
          <div className="stat-value">{failed}</div>
          <div className="stat-sub">need attention</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{active}</div>
          <div className="stat-sub">running now</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Client Overview</span>
          <div className="filter-tabs">
            {["all", "success", "failed", "active"].map(f => (
              <button key={f} className={`filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Current Version</th>
              <th>Last Status</th>
              <th>Scheduled By</th>
              <th>Scheduled At</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">◌</div>No clients match this filter</div></td></tr>
            ) : filtered.map(c => {
              const last = c.upgrades.at(-1);
              return (
                <tr key={c.id}>
                  <td className="name-cell">{c.name}</td>
                  <td><span className="version-badge">{c.currentVersion}</span></td>
                  <td><span className={`status-badge ${getStatusClass(last?.status)}`}>{last ? last.status : "No upgrades"}</span></td>
                  <td style={{ color: "var(--text-muted)" }}>{last?.scheduledBy || "—"}</td>
                  <td style={{ color: "var(--text-muted)" }}>{last ? new Date(last.scheduledAt).toLocaleString() : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Scheduler() {
  // ── 1. ALL state declarations at the top ──
  const [clients, setClients] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [form, setForm] = useState({ clientId: "", toVersion: "", scheduledBy: "", scheduledAt: "" });
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── 2. Derived value — MUST be before any JSX that uses it ──
  const selectedClient = clients.find(c => c.id == form.clientId);

  // ── 3. Effects ──
  useEffect(() => {
    const load = async () => {
      try {
        const [cr, br] = await Promise.all([
          fetch("http://localhost:5000/clients"),
          fetch("http://localhost:5000/builds")
        ]);
        setClients(await cr.json());
        setBuilds(await br.json());
      } catch { setError("Cannot connect to backend server."); }
    };
    load();
  }, []);

  // ── 4. Handlers ──
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const schedule = async () => {
    if (!form.clientId || !form.toVersion || !form.scheduledBy || !form.scheduledAt)
      return setError("All fields are required.");
    if (selectedClient && isSameOrLower(form.toVersion, selectedClient.currentVersion))
      return setError("Cannot schedule — target version must be higher than current version.");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/schedule-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          toVersion: form.toVersion,
          scheduledBy: form.scheduledBy,
          scheduledAt: form.scheduledAt
        })
      });
      if (!res.ok) throw new Error(await res.text());
      setToast("Upgrade scheduled successfully!");
      setForm({ clientId: "", toVersion: "", scheduledBy: "", scheduledAt: "" });
    } catch (e) { setError(e.message || "Failed to schedule upgrade."); }
    finally { setLoading(false); }
  };

  // ── 5. Version preview logic ──
  const renderVersionPreview = () => {
    if (!selectedClient || !form.toVersion) return null;
    if (form.toVersion === selectedClient.currentVersion) {
      return (
        <div className="warn-bar">
          ⚠ Client is already on version {form.toVersion} — no upgrade needed
        </div>
      );
    }
    if (isSameOrLower(form.toVersion, selectedClient.currentVersion)) {
      return (
        <div className="warn-bar">
          ⚠ Cannot downgrade — client is currently on {selectedClient.currentVersion}
        </div>
      );
    }
    return (
      <div className="version-preview">
        <span style={{ color: "var(--text-dim)" }}>FROM</span>
        <span className="version-badge">{selectedClient.currentVersion}</span>
        <span style={{ color: "var(--text-dim)", margin: "0 4px" }}>→</span>
        <span style={{ color: "var(--text-dim)" }}>TO</span>
        <span className="version-badge">{form.toVersion}</span>
      </div>
    );
  };

  // ── 6. Return JSX ──
  return (
    <div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div>
          <div className="page-title">Schedule Upgrade</div>
          <div className="page-subtitle">Push a new build to a client environment</div>
        </div>
      </div>
      {error && <div className="error-bar">⚠ {error}</div>}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--text-dim)", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: 20 }}>
          Upgrade Details
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Client</label>
            <select value={form.clientId} onChange={e => set("clientId", e.target.value)}>
              <option value="">Select a client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Target Build</label>
            <select value={form.toVersion} onChange={e => set("toVersion", e.target.value)}>
              <option value="">Select a build…</option>
              {builds.map((b, i) => <option key={i} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Scheduled By</label>
            <input type="text" placeholder="Your name" value={form.scheduledBy} onChange={e => set("scheduledBy", e.target.value)} />
          </div>

          <div className="form-group">
            <label>Scheduled At</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => set("scheduledAt", e.target.value)} />
          </div>

          {/* Version preview / warning — rendered via helper above */}
          {(selectedClient && form.toVersion) && (
            <div className="form-group full">
              {renderVersionPreview()}
            </div>
          )}

          <div className="form-group full" style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              className="btn btn-primary"
              onClick={schedule}
              disabled={
                loading ||
                !form.toVersion ||
                !selectedClient ||
                isSameOrLower(form.toVersion, selectedClient?.currentVersion)
              }
            >
              {loading ? "Scheduling…" : "◷  Schedule Upgrade"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Logs() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/clients")
      .then(r => r.json())
      .then(setClients)
      .catch(() => setError("Cannot connect to backend."));
  }, []);

  const fetchLogs = async (id = selectedClient) => {
    if (!id) return;
    try {
      const res = await fetch(`http://localhost:5000/logs/${id}`);
      if (!res.ok) throw new Error();
      setLogs(await res.json());
      setError(null);
    } catch { setError("Failed to load logs."); }
  };

  useEffect(() => {
    if (!autoRefresh || !selectedClient) return;
    fetchLogs();
    const i = setInterval(() => fetchLogs(), 3000);
    return () => clearInterval(i);
  }, [autoRefresh, selectedClient]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Upgrade Logs</div>
          <div className="page-subtitle">Full deployment history per client</div>
        </div>
      </div>
      {error && <div className="error-bar">⚠ {error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="controls-bar">
          <select style={{ maxWidth: 280 }} value={selectedClient} onChange={e => { setSelectedClient(e.target.value); setLogs([]); }}>
            <option value="">Select a client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={() => fetchLogs()} style={{ padding: "12px 18px", fontSize: 13 }}>
            Fetch Logs
          </button>
          <label className="toggle-label">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            Auto-refresh (3s)
          </label>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">≡</div>
          Select a client and fetch logs to begin
        </div>
      ) : logs.map((upgrade, idx) => (
        <div key={idx} className="log-card">
          <div className="log-card-header">
            <div>
              <div className="log-version-flow">
                <span className="version-badge">{upgrade.fromVersion}</span>
                <span className="flow-arrow">→</span>
                <span className="version-badge">{upgrade.toVersion}</span>
                <span className={`status-badge ${getStatusClass(upgrade.status)}`}>{upgrade.status}</span>
              </div>
              <div className="log-meta">By {upgrade.scheduledBy} · {new Date(upgrade.scheduledAt).toLocaleString()}</div>
            </div>
          </div>
          <div className="log-entries">
            {upgrade.logs.length === 0
              ? <div style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: 12, padding: "12px 0" }}>No log entries yet.</div>
              : upgrade.logs.map((l, i) => (
                <div key={i} className="log-entry">
                  <span className="log-time">{new Date(l.time).toLocaleTimeString()}</span>
                  <span className="log-dot" />
                  <span className="log-msg">{l.message}</span>
                </div>
              ))
            }
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <>
      <style>{styles}</style>
      <Router>
        <div className="app-wrapper">
          <Sidebar />
          <main className="main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scheduler" element={<Scheduler />} />
              <Route path="/logs" element={<Logs />} />
            </Routes>
          </main>
        </div>
      </Router>
    </>
  );
}