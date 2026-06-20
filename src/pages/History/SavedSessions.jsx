import { useState, useEffect } from "react";

const langColors = {
  JavaScript: { bg: "#f7df1e22", border: "#f7df1e", text: "#c9a800" },
  Python:     { bg: "#3776ab22", border: "#3776ab", text: "#4a9ede" },
  Go:         { bg: "#00add822", border: "#00add8", text: "#00add8" },
  TypeScript: { bg: "#3178c622", border: "#3178c6", text: "#3178c6" },
  Java:       { bg: "#f8981d22", border: "#f8981d", text: "#f8981d" },
  Rust:       { bg: "#ce412b22", border: "#ce412b", text: "#ce412b" },
};

// ─── SCORE RING ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 56 }) {
  const s = score ?? 0;
  const color = s >= 90 ? "#22d3a0" : s >= 75 ? "#60a5fa" : "#ff6b35";
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const dash = (s / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2535" strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.22} fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}>
        {s}%
      </text>
    </svg>
  );
}

// ─── METRIC BAR ───────────────────────────────────────────────────────────────
function MetricBar({ label, value, color }) {
  if (value == null) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#6b7a99", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <span style={{ fontSize: 11, color: "#c8d0e7", fontFamily: "'JetBrains Mono', monospace" }}>{value}%</span>
      </div>
      <div style={{ height: 4, background: "#1e2535", borderRadius: 4 }}>
        <div style={{ height: "100%", borderRadius: 4, background: color, width: `${value}%`, transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({ session, onClose, onDelete }) {
  const lang = langColors[session.language] || { border: "#8b5cf6", text: "#8b5cf6" };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const score = session.overall_score ?? 0;
  const scoreColor = score >= 90 ? "#22d3a0" : score >= 75 ? "#60a5fa" : "#ff6b35";
  const hasMetrics = session.readability != null || session.security != null;

  let grade = "D";
  if (score >= 90) grade = "A+";
  else if (score >= 80) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 60) grade = "C";

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20, animation: "fadeIn 0.2s ease" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0d1117", border: "1px solid #1e2d45", borderRadius: 16, width: "100%", maxWidth: 780, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 40px 120px #000a", animation: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1)" }}>

        {/* Header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #1e2d45", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "#e8edf5" }}>{session.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", background: lang.border + "20", border: `1px solid ${lang.border}55`, color: lang.text, borderRadius: 20 }}>{session.language}</span>
              <span style={{ fontSize: 10, padding: "3px 9px", background: "#22d3a018", border: "1px solid #22d3a033", color: "#22d3a0", borderRadius: 20, letterSpacing: "0.05em" }}>Saved</span>
            </div>
            <div style={{ fontSize: 12, color: "#4a5568" }}>Saved on {session.savedAt} at {session.time}</div>
          </div>
          <button onClick={onClose} style={{ background: "#1e2535", border: "none", color: "#6b7a99", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px", display: "grid", gridTemplateColumns: hasMetrics ? "1fr 1fr" : "1fr", gap: 20 }}>

          {/* Left: Health */}
          {hasMetrics && (
            <div>
              <div style={{ background: "#0a0e17", border: "1px solid #1e2d45", borderRadius: 12, padding: 20, marginBottom: 16, display: "flex", gap: 20, alignItems: "center" }}>
                <ScoreRing score={score} size={72} />
                <div>
                  <div style={{ fontSize: 12, color: "#4a5568", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Health Score</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor }}>{grade}</div>
                </div>
              </div>
              <div style={{ background: "#0a0e17", border: "1px solid #1e2d45", borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Code Metrics</div>
                <MetricBar label="Readability"     value={session.readability}     color="#22d3a0" />
                <MetricBar label="Security"        value={session.security}        color="#ff6b35" />
                <MetricBar label="Performance"     value={session.performance}     color="#60a5fa" />
                <MetricBar label="Maintainability" value={session.maintainability} color="#f59e0b" />
              </div>
            </div>
          )}

          {/* Right: Review Output */}
          <div style={{ background: "#0a0e17", border: "1px solid #1e2d45", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Review Output</div>
            <pre style={{ fontSize: 12, color: "#8892a4", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", fontFamily: "sans-serif", maxHeight: hasMetrics ? 300 : 400, overflowY: "auto" }}>
              {session.result || "No review output."}
            </pre>
          </div>
        </div>

        {/* Code preview (collapsible) */}
        {session.code && (
          <div style={{ padding: "0 28px 20px" }}>
            <button onClick={() => setShowCode(p => !p)} style={{ background: "#0a0e17", border: "1px solid #1e2d45", borderRadius: 8, padding: "8px 14px", color: "#4a5568", fontSize: 12, cursor: "pointer", width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between" }}>
              <span>📄 Code Preview · {session.code.split("\n").length} lines</span>
              <span>{showCode ? "▲ Hide" : "▼ Show"}</span>
            </button>
            {showCode && (
              <div style={{ background: "#070b12", border: "1px solid #1e2d45", borderTop: "none", borderRadius: "0 0 8px 8px", padding: 16, maxHeight: 260, overflowY: "auto" }}>
                <pre style={{ margin: 0, color: "#a5f3fc", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{session.code}</pre>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #1e2d45", display: "flex", gap: 10, alignItems: "center" }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ background: "#ff445518", border: "1px solid #ff445533", color: "#ff4455", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
              🗑 Remove Session
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#ff4455" }}>Confirm delete?</span>
              <button onClick={() => onDelete(session.id)} style={{ background: "#ff4455", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Yes, delete</button>
              <button onClick={() => setConfirmDelete(false)} style={{ background: "#1e2535", border: "1px solid #2a3548", color: "#8892a4", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function detectLanguage(code = "") {
  const c = code.toLowerCase();
  if (c.includes("def ") || c.includes("import pandas") || c.includes("print(")) return "Python";
  if (c.includes("package main") || c.includes("func ")) return "Go";
  if (c.includes("public class ") || c.includes("system.out.print")) return "Java";
  if (c.includes("fn main()") || c.includes("let mut ")) return "Rust";
  if (c.includes(": string") || (c.includes("interface ") && c.includes("type "))) return "TypeScript";
  return "JavaScript";
}

function mapSession(s) {
  let savedAt = "Unknown", time = "";
  try {
    const d = new Date(s.date);
    savedAt = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    time    = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch (_) {}

  return {
    id:              s.id,
    label:           s.label || "Saved Session",
    language:        detectLanguage(s.code),
    savedAt,
    time,
    code:            s.code || "",
    result:          s.result || "",
    readability:     s.readability    ?? null,
    security:        s.security       ?? null,
    performance:     s.performance    ?? null,
    maintainability: s.maintainability ?? null,
    overall_score:   s.overall_score  ?? null,
  };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SavedSessions() {
  const [sessions,     setSessions]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [hovered,      setHovered]      = useState(null);
  const [deleteToast,  setDeleteToast]  = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("acr_token");
    fetch("/api/saved-sessions", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error("Failed to fetch"); return res.json(); })
      .then(data => { setSessions(data.map(mapSession)); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const handleDelete = async (id) => {
    const token = localStorage.getItem("acr_token");
    const res = await fetch(`/api/saved-sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSessions(prev => prev.filter(s => s.id !== id));
      setSelected(null);
      setDeleteToast(true);
      setTimeout(() => setDeleteToast(false), 3000);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes fadeIn  { from { opacity: 0 }                         to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes rowIn   { from { opacity: 0; transform: translateX(-12px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes spin    { to   { transform: rotate(360deg) } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        ::-webkit-scrollbar       { width: 6px }
        ::-webkit-scrollbar-track { background: #0d1117 }
        ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 3px }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080c12", fontFamily: "'Syne', sans-serif", padding: "32px 24px", color: "#c8d0e7" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 11, color: "#3a4a66", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Automated Code Review</div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#e8edf5", letterSpacing: "-0.03em" }}>🔖 Saved Sessions</h1>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#3a4a66" }}>Sessions saved from Analysis History. Click any row to view the full report.</p>
            </div>
            {!loading && !error && (
              <div style={{ background: "#0d1117", border: "1px solid #1e2d45", borderRadius: 10, padding: "8px 16px", fontSize: 12, color: "#4a5568", fontFamily: "'JetBrains Mono', monospace" }}>
                {sessions.length} saved
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #1e2d45", borderTop: "3px solid #60a5fa", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 13, color: "#3a4a66" }}>Loading saved sessions…</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: "#ff445518", border: "1px solid #ff445544", borderRadius: 12, padding: "20px 24px", color: "#ff4455", fontSize: 13, textAlign: "center" }}>
              Failed to load: {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && sessions.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>📌</div>
              <div style={{ fontSize: 16, color: "#3a4a66", fontWeight: 700 }}>No saved sessions yet</div>
              <div style={{ fontSize: 13, color: "#2a3548", marginTop: 8, lineHeight: 1.6 }}>
                Go to <strong style={{ color: "#c4b5fd" }}>Analysis History</strong>, open any entry and click <strong style={{ color: "#22d3a0" }}>Save Session</strong> to pin it here.
              </div>
            </div>
          )}

          {/* Table */}
          {!loading && !error && sessions.length > 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px 70px 1fr", gap: 16, padding: "0 20px 10px", fontSize: 10, color: "#3a4a66", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                <span>Saved On</span>
                <span>Label</span>
                <span>Language</span>
                <span style={{ textAlign: "center" }}>Score</span>
                <span>Preview</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sessions.map((session, i) => {
                  const lang = langColors[session.language] || { bg: "#8b5cf622", border: "#8b5cf6", text: "#8b5cf6" };
                  const isHovered = hovered === session.id;
                  const score = session.overall_score;
                  const preview = (session.result || "").replace(/\n/g, " ").slice(0, 90);

                  return (
                    <div key={session.id}
                      onClick={() => setSelected(session)}
                      onMouseEnter={() => setHovered(session.id)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        display: "grid", gridTemplateColumns: "180px 1fr 120px 70px 1fr",
                        gap: 16, alignItems: "center",
                        background: isHovered ? "#0f1620" : "#0a0e17",
                        border: `1px solid ${isHovered ? "#2a3d5a" : "#151e2e"}`,
                        borderRadius: 12, padding: "16px 20px", cursor: "pointer",
                        transition: "all 0.18s ease",
                        animation: `rowIn 0.4s ease ${i * 0.06}s both`,
                        boxShadow: isHovered ? "0 8px 32px #00000066" : "none",
                      }}>

                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#c8d0e7" }}>{session.savedAt}</div>
                        <div style={{ fontSize: 11, color: "#3a4a66", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{session.time}</div>
                      </div>

                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: isHovered ? "#e8edf5" : "#a0aec0", transition: "color 0.18s" }}>
                        {session.label}
                      </div>

                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", background: lang.bg, border: `1px solid ${lang.border}44`, color: lang.text, borderRadius: 20 }}>
                          {session.language}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "center" }}>
                        {score != null
                          ? <ScoreRing score={score} size={50} />
                          : <span style={{ fontSize: 11, color: "#2a3548" }}>—</span>
                        }
                      </div>

                      <div style={{ fontSize: 11, color: "#3a4a66", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {preview}{preview.length >= 90 ? "…" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "#2a3548", letterSpacing: "0.08em" }}>
                Click any row to view full report
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete toast */}
      {deleteToast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2535", border: "1px solid #2a3548", borderRadius: 10, padding: "12px 20px", fontSize: 13, color: "#c8d0e7", animation: "toastIn 0.3s ease", boxShadow: "0 8px 32px #000a" }}>
          ✅ Session removed
        </div>
      )}

      {selected && (
        <DetailPanel session={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />
      )}
    </>
  );
}
