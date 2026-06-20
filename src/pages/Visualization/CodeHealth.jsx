import { useState, useEffect } from "react";

// ─── SVG SCORE RING ───────────────────────────────────────────────────────────
function ScoreRing({ score, size = 140 }) {
  const color = score >= 90 ? "#22c55e" : score >= 75 ? "#16a34a" : score >= 60 ? "#f59e0b" : "#ef4444";
  const grade = score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 60 ? "Fair" : "Poor";
  const r = size / 2 - 12;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: size * 0.2, fontWeight: 700, color, lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: size * 0.1, color: "#6b7280", marginTop: 2 }}>{grade}</span>
      </div>
    </div>
  );
}

// ─── METRIC BAR ───────────────────────────────────────────────────────────────
function MetricBar({ label, value, color, isRaw }) {
  const barPct = isRaw ? Math.min(100, value * 3) : value;
  const displayVal = isRaw ? value : `${value}%`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
      <span style={{ width: 130, fontSize: 13.5, color: "#374151", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 7, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4, background: color,
          width: `${barPct}%`, transition: "width 1s ease",
        }} />
      </div>
      <span style={{ width: 38, textAlign: "right", fontSize: 13, fontWeight: 600, color, flexShrink: 0 }}>
        {displayVal}
      </span>
    </div>
  );
}

// ─── SVG TREND CHART ──────────────────────────────────────────────────────────
function TrendChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13 }}>
        Run more analyses to see the health trend
      </div>
    );
  }

  const W = 900, H = 200, padL = 44, padR = 16, padT = 12, padB = 32;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const xs = (i) => padL + (i / (data.length - 1)) * cW;
  const ys = (v) => padT + cH - (Math.min(100, Math.max(0, v)) / 100) * cH;

  const path = (key) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${ys(d[key]).toFixed(1)}`).join(" ");

  const yTicks = [0, 20, 40, 60, 80, 100];
  const step = Math.max(1, Math.floor(data.length / 6));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {/* Y grid + labels */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={padL} y1={ys(v)} x2={W - padR} y2={ys(v)}
            stroke="#e5e7eb" strokeWidth="1" />
          <text x={padL - 6} y={ys(v)} textAnchor="end" fill="#9ca3af"
            fontSize="11" dominantBaseline="middle">{v}</text>
        </g>
      ))}

      {/* Score line (solid green) */}
      <path d={path("score")} fill="none" stroke="#22c55e" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Bugs line (dashed red) */}
      <path d={path("bugs")} fill="none" stroke="#ef4444" strokeWidth="1.5"
        strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Warnings line (dashed orange) */}
      <path d={path("warnings")} fill="none" stroke="#f59e0b" strokeWidth="1.5"
        strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Score dots */}
      {data.map((d, i) => (
        <circle key={i} cx={xs(i)} cy={ys(d.score)} r="4.5"
          fill="#22c55e" stroke="#fff" strokeWidth="2" />
      ))}
      {/* Bug dots */}
      {data.map((d, i) => (
        <circle key={i} cx={xs(i)} cy={ys(d.bugs)} r="3.5"
          fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
      ))}
      {/* Warning dots */}
      {data.map((d, i) => (
        <circle key={i} cx={xs(i)} cy={ys(d.warnings)} r="3.5"
          fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
      ))}

      {/* X axis labels */}
      {data.map((d, i) => {
        if (i % step !== 0 && i !== data.length - 1) return null;
        return (
          <text key={i} x={xs(i)} y={H - 4} textAnchor="middle"
            fill="#9ca3af" fontSize="11">{d.label}</text>
        );
      })}
    </svg>
  );
}

// ─── PARSE ACTIVE ISSUES FROM LLM RESULT TEXT ────────────────────────────────
function parseIssues(result) {
  if (!result) return [];
  const issues = [];
  const lines = result.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw || raw.length < 12) continue;

    const isNumbered = /^\d+[\.\)]\s/.test(raw);
    const isBullet = /^[-*•#]+\s/.test(raw);
    const isHeader = /^\*\*/.test(raw);

    if (isNumbered || isBullet || isHeader) {
      const text = raw.replace(/^\d+[\.\)]\s|^[-*•#]+\s|\*\*/g, "").trim();
      if (text.length < 10) continue;

      const lower = text.toLowerCase();
      let severity = "Low";
      if (lower.match(/critical|security|vulnerab|injection|exploit|overflow/)) severity = "High";
      else if (lower.match(/bug|error|exception|warning|incorrect|undefined|null|fail/)) severity = "Medium";

      const lineMatch = text.match(/line\s+(\d+)/i);
      const lineNum = lineMatch ? lineMatch[1] : null;

      let desc = "";
      if (i + 1 < lines.length) {
        const nxt = lines[i + 1].trim();
        if (nxt && !/^\d+[\.\)]\s/.test(nxt) && !/^[-*•]\s/.test(nxt) && nxt.length > 5) {
          desc = nxt.replace(/\*\*/g, "").trim();
        }
      }

      issues.push({
        title: text.slice(0, 90),
        desc: desc.slice(0, 120),
        severity,
        line: lineNum,
      });
      if (issues.length >= 8) break;
    }
  }

  return issues;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function CodeHealth() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("acr_token");
    fetch("/api/analysis-history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error("Failed to load history"); return r.json(); })
      .then(data => { setHistory(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <div style={{
            width: 32, height: 32, border: "3px solid #e5e7eb", borderTop: "3px solid #22c55e",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          Loading code health data…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, color: "#ef4444", fontFamily: "sans-serif", fontSize: 14 }}>
        Failed to load: {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ padding: "80px 40px", textAlign: "center", fontFamily: "sans-serif", color: "#6b7280" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: "#374151" }}>No data yet</div>
        <div style={{ fontSize: 13 }}>Run a code review from the Dashboard to see code health metrics here.</div>
      </div>
    );
  }

  // Most recent entry drives current metrics
  const latest = history[0];
  const overallScore = latest.health?.overall_score ?? 0;
  const maintainability = latest.health?.maintainability ?? 0;
  const readability = latest.health?.readability ?? 0;
  const security = latest.health?.security ?? 0;
  const performance = latest.health?.performance ?? 0;

  // Issue counts from latest result text
  const resultText = latest.result || "";
  const rl = resultText.toLowerCase();
  const bugs = (rl.match(/\bbug\b|\berror\b|\bexception\b|\bcrash\b|\bfail/g) || []).length;
  const warnings = (rl.match(/\bwarning\b|\bdeprecated\b|\bunused\b|\bredundant\b/g) || []).length;
  const suggestions = (rl.match(/\bsuggest\b|\brecommend\b|\bconsider\b|\bimprove\b/g) || []).length;
  const optimized = Math.max(0, 100 - bugs * 3 - warnings * 2);

  // Complexity: line count of code (more lines = higher complexity)
  const codeLines = latest.code ? latest.code.split("\n").length : 0;
  const complexity = Math.min(50, codeLines);

  // Trend data — oldest first
  const trendData = [...history].reverse().map(entry => {
    const d = new Date(entry.date);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const el = (entry.result || "").toLowerCase();
    const eBugs = Math.min(100, (el.match(/\bbug\b|\berror\b|\bexception\b/g) || []).length * 8);
    const eWarn = Math.min(100, (el.match(/\bwarning\b|\bdeprecated\b|\bunused\b/g) || []).length * 8);
    return {
      label,
      score: entry.health?.overall_score ?? 0,
      bugs: eBugs,
      warnings: eWarn,
    };
  });

  // Active issues from latest result
  const activeIssues = parseIssues(resultText);

  return (
    <div style={{
      background: "#fff", minHeight: "100vh",
      padding: "32px 40px", fontFamily: "'Segoe UI', sans-serif", color: "#111827",
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Page header */}
      <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>
        VISUALIZATION
      </div>
      <h1 style={{ margin: "0 0 36px", fontSize: 26, fontWeight: 700, color: "#111827" }}>Code health</h1>

      {/* ── Top Row: Score + Quality Metrics ── */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 48, marginBottom: 36 }}>

        {/* Overall Score */}
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>
            OVERALL SCORE
          </div>
          <ScoreRing score={overallScore} size={150} />
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 12.5, color: "#ef4444" }}>● Bugs {bugs}</span>
            <span style={{ fontSize: 12.5, color: "#f59e0b" }}>● Warnings {warnings}</span>
            <span style={{ fontSize: 12.5, color: "#3b82f6" }}>● Suggestions {suggestions}</span>
            <span style={{ fontSize: 12.5, color: "#22c55e" }}>● Optimized {optimized}</span>
          </div>
        </div>

        {/* Quality Metrics */}
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>
            QUALITY METRICS
          </div>
          <MetricBar label="Maintainability" value={maintainability} color="#7c3aed" />
          <MetricBar label="Readability"     value={readability}     color="#22c55e" />
          <MetricBar label="Security"        value={security}        color="#3b82f6" />
          <MetricBar label="Performance"     value={performance}     color="#f59e0b" />
          <MetricBar label="Complexity"      value={complexity}      color="#ef4444" isRaw />
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", marginBottom: 32 }} />

      {/* ── Health Trend ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            HEALTH TREND
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b7280" }}>
            <span style={{ color: "#22c55e" }}>— Score</span>
            <span style={{ color: "#ef4444" }}>— Bugs</span>
            <span style={{ color: "#f59e0b" }}>— Warnings</span>
          </div>
        </div>
        <TrendChart data={trendData} />
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", marginBottom: 32 }} />

      {/* ── Active Issues ── */}
      <div>
        <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
          ACTIVE ISSUES · {activeIssues.length}
        </div>

        {activeIssues.length === 0 ? (
          <div style={{ color: "#9ca3af", fontSize: 13 }}>No specific issues detected in the latest analysis output.</div>
        ) : (
          activeIssues.map((issue, i) => {
            const sColor =
              issue.severity === "High"   ? "#ef4444" :
              issue.severity === "Medium" ? "#f59e0b" : "#22c55e";
            return (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                padding: "18px 0", borderBottom: "1px solid #f3f4f6",
              }}>
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
                    {issue.title}
                  </div>
                  {issue.desc && (
                    <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5 }}>
                      {issue.line ? `Line ${issue.line} — ` : ""}{issue.desc}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 4,
                  background: sColor + "18", color: sColor,
                  border: `1px solid ${sColor}44`, flexShrink: 0,
                }}>
                  {issue.severity}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
