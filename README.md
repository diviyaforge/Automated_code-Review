# Changes Made — Automated Code Review Platform

Date: 2026-06-20

---

## 1. LLM Switch — Ollama → Groq (Llama 3.3 70B)

### What changed
| File | Change |
|---|---|
| `backend/services/llm_service.py` | Replaced `import ollama` with `from openai import OpenAI`. Both `review_code()` and `chat_with_ai()` now call the Groq API via OpenAI-compatible client. |
| `backend/requirements.txt` | Removed `ollama`, added `openai` |
| `backend/.env` | Added `OPENAI_API_KEY` and `OPENAI_BASE_URL=https://api.groq.com/openai/v1` |
| `backend/.env.example` | Same additions for reference |

### Why
The local Ollama model (`qwen2.5-coder:7b`) was single-threaded — only one request could run at a time. Running 6 simultaneous analysis features caused all requests to fail with HTTP 500. Groq's hosted Llama 3.3 70B is faster, more capable, and handles concurrent requests.

### Model in use
- **Provider:** Groq (`https://api.groq.com/openai/v1`)
- **Model ID:** `llama-3.3-70b-versatile`
- **API key format:** `gsk_...` (Groq key, not OpenAI key)

---

## 2. Feature-Specific Prompts Fixed

### What changed
**`backend/services/llm_service.py` — `review_code()` function**

Before, the function prepended a hardcoded 5-point generic list (explain code, detect bugs, detect security issues, analyze complexity, suggest improvements) before the actual feature prompt. The LLM always produced the same general analysis regardless of which feature called it.

```python
# BEFORE — generic requirements override the custom prompt
prompt = f"""...
Requirements:
1. Explain what the code does
2. Detect bugs
3. Detect security issues
4. Analyze complexity
5. Suggest improvements

User Request: {custom_prompt}
"""

# AFTER — custom prompt is the only instruction
prompt = f"""You are a senior software engineer. Answer only what is asked.

Task:
{custom_prompt}

Code:
{code}
"""
```

### Effect on each feature page
| Feature | Prompt sent | LLM now returns |
|---|---|---|
| Bug Detection | List bugs with line number and severity | Focused bug list only |
| Code Explanation | Plain-English summary + bullet points | Explanation only |
| Semantic Search | Map functions, classes, patterns | Structure map only |
| Security Scanner | List security issues with severity | Security issues only |
| Vulnerability Analysis | Identify CVEs and injection risks | Vulnerability report only |
| Code Health | Score readability/maintainability | Health score only |

---

## 3. "Run All" — Fixed Parallel Execution Crash

### What changed
**`src/pages/DashboardHome.jsx` — `runAll()` function**

Before, all 6 analysis requests were sent simultaneously using `Promise.all`. Ollama could not handle this (single-threaded) so all 6 returned HTTP 500. Even after moving to Groq, sequential execution was kept because progress updates live as each feature completes.

```js
// BEFORE — all 6 fire at once, Ollama crashes
await Promise.all(runnableFeatures.map(f => callClaude(f.prompt, code)));

// AFTER — one at a time, progress bar updates live
for (const feature of runnableFeatures) {
  const result = await callClaude(feature.prompt, code, false);
  setStatuses(prev => ({ ...prev, [feature.id]: "done" }));
}
```

### Effect
- Progress bar increments in real time as each feature completes (1/6 → 2/6 → … → 6/6)
- If one feature fails, the rest continue — only the failed card shows an error badge
- Each feature page receives its own specific result, not a shared one

---

## 4. Silent 500 Error Fix in callClaude

### What changed
**`src/pages/DashboardHome.jsx` — `callClaude()` function**

Before, if the backend returned HTTP 500, `callClaude` still returned `data.result || "No response."` — the feature card showed green "DONE ✓" with empty text. No error was visible.

```js
// BEFORE — 500 silently returns "No response."
const data = await res.json();
return data.result || "No response.";

// AFTER — throws so the catch block sets status to "error"
const data = await res.json();
if (!res.ok) {
  throw new Error(typeof data.detail === "string" ? data.detail : `HTTP ${res.status}`);
}
return data.result || "No response.";
```

### Effect
- Failed features now show a red "Error" badge instead of a green "Done ✓" with empty text
- The actual error message from the backend is available in the thrown error
- Other features continue running even if one fails

---

## 5. Batch Results Shared Across Feature Pages

### What changed
**`src/pages/Dashboard.jsx`** — Added `featureResults` state lifted from DashboardHome.

**`src/pages/DashboardHome.jsx`** — Added `onBatchResults` prop. After all features complete, calls `onBatchResults(resultsDict)` to push results up to Dashboard.

**All feature pages** (`BugDetection`, `CodeExplanation`, `SemanticSearch`, `SecurityScanner`, `VulnerabilityAnalysis`) — Added `batchResult` prop with this logic:

```js
const individualResult = analysisResult && analysisLabel === FEATURE.label ? analysisResult : null;
const displayResult = individualResult || batchResult || null;
```

### Effect
- Before: navigating to a feature page after "Run All" showed "No code loaded" or blank
- After: each feature page immediately shows its specific result from "Run All"
- Running a feature individually still works and takes priority over the batch result
- Button text changes to "Re-run" if a result already exists

---

## 6. openai Package Installation

### What changed
```bash
pip install openai
# Installed: openai-2.43.0
```

### Why this matters
Without this package, the backend failed to import `llm_service.py` at startup. Every API call returned a connection error or hung indefinitely — causing the infinite loading spinner on all feature pages and no replies in AI Chat Assistant.

**Always run `pip install -r requirements.txt` after pulling changes.**

---

## 7. Saved Sessions — Full Implementation

### What changed

#### Backend

**`backend/models.py`** — Added 5 health metric columns to the `Session` model:
```python
readability      = Column(Integer, nullable=True)
security         = Column(Integer, nullable=True)
performance      = Column(Integer, nullable=True)
maintainability  = Column(Integer, nullable=True)
overall_score    = Column(Integer, nullable=True)
```

**`backend/schemas.py`** — Updated `SessionCreate` and `SessionResponse` to include the 5 health fields as optional integers.

**`backend/routers/sessions.py`** — `POST /api/saved-sessions` now stores the health metrics alongside code, result, and label.

**`backend/main.py`** — Added a `_migrate()` function that runs at startup and adds the new columns to the existing SQLite database without deleting any data:
```python
def _migrate():
    for col in ["readability", "security", "performance", "maintainability", "overall_score"]:
        try:
            conn.execute(text(f"ALTER TABLE sessions ADD COLUMN {col} INTEGER"))
        except Exception:
            pass  # column already exists
```

#### Frontend

**`src/pages/History/AnalysisHistory.jsx`** — "Save Session" button now sends health metrics:
```js
body: JSON.stringify({
  code, result, label,
  readability, security, performance, maintainability, overall_score
})
```

**`src/pages/History/SavedSessions.jsx`** — Complete rewrite with:
- Health score ring (animated SVG, color-coded A+/A/B/C/D grade)
- Metric bars for Readability, Security, Performance, Maintainability
- Full review output panel
- Collapsible code preview with line count
- Delete with two-step confirmation
- Language auto-detection badge (Python, JavaScript, TypeScript, Go, Java, Rust)
- Score visible in the table row
- Empty state with instructions to save from Analysis History

### How to save a session
1. Go to **Analysis History** in the sidebar
2. Click any row to open the detail panel
3. Click **Save Session** button
4. Go to **Saved Sessions** — the entry appears with full health metrics

---

## Known Limitations / Watch Out For

### API Key not set
If `OPENAI_API_KEY` is missing or wrong in `backend/.env`, every `/api/analysis/review` and `/api/analysis/chat` call returns HTTP 500 with an authentication error from Groq. The error message will say something like `AuthenticationError: 401 Incorrect API key`. Fix: set the correct `gsk_...` key in `.env` and restart the backend.

### Groq Rate Limits
Groq free tier has rate limits (requests per minute and tokens per minute). If you run "Run All" repeatedly in quick succession, Groq may return HTTP 429 (Too Many Requests). The feature card will show a red "Error" badge. Wait ~60 seconds and try again.

### Old Saved Sessions Have No Health Score
Sessions saved before this update (or saved directly from feature pages via the 💾 Save button) have `null` health metrics. In the Saved Sessions detail panel, the health score section is hidden automatically when metrics are null — only the review output is shown.

### Sequential "Run All" is Slower Than Parallel
"Run All" runs 6 features one at a time (sequential). With Groq this is safe and reliable, but takes longer than if they ran in parallel. Total time is roughly 6 × (time per request). Groq typically responds in 1–3 seconds per feature, so expect 6–18 seconds total for a full run.

### SQLite in Production
The app uses SQLite. For a multi-user production deployment, switch `DATABASE_URL` in `.env` to PostgreSQL or MySQL. SQLite does not handle concurrent writes well.

---

## File Summary

| File | Type of change |
|---|---|
| `backend/services/llm_service.py` | LLM provider switch + prompt fix |
| `backend/requirements.txt` | `ollama` → `openai` |
| `backend/.env` | Added Groq API key + base URL |
| `backend/.env.example` | Same (reference) |
| `backend/main.py` | Added startup DB migration |
| `backend/models.py` | Added 5 health columns to Session |
| `backend/schemas.py` | Updated SessionCreate + SessionResponse |
| `backend/routers/sessions.py` | Save + return health metrics |
| `src/pages/DashboardHome.jsx` | Sequential run, error throwing, batch results callback |
| `src/pages/Dashboard.jsx` | featureResults state, batchResult props passed to pages |
| `src/pages/Ai-analysis/BugDetection.jsx` | batchResult prop + displayResult logic |
| `src/pages/Ai-analysis/CodeExplanation.jsx` | batchResult prop + displayResult logic |
| `src/pages/Ai-analysis/SemanticSearch.jsx` | batchResult prop + displayResult logic |
| `src/pages/devsecops/SecurityScanner.jsx` | batchResult prop + displayResult logic |
| `src/pages/devsecops/VulnerabilityAnalysis.jsx` | batchResult prop + displayResult logic |
| `src/pages/History/AnalysisHistory.jsx` | Save includes health metrics |
| `src/pages/History/SavedSessions.jsx` | Full rewrite with health UI |
