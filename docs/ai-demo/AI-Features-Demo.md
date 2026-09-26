# MyBookTimeZon — AI Features Demo Report

**Date:** 2026-09-26  
**Problem statement fit:** Frontier Intelligence at Flash Speed (`gemini-3.8-flash`)  
**App:** SlotNexa / MyBookTimeZon (Spring Boot + React)

> **Security:** Do **not** put API keys in git. Set `GEMINI_API_KEY` in your IDE Run Configuration or shell.  
> If a key was pasted in chat, **rotate it** in [Google AI Studio](https://aistudio.google.com/apikey).

---

## 1. AI surfaces in this product

| # | Feature | Route / API | Backend | Status in test |
|---|---------|-------------|---------|----------------|
| 1 | Beauty Coach chat | UI `/coach` · `POST /api/v1/beauty-coach/chat` | Gemini / OpenAI proxy | **App OK** (offline heuristic when key not loaded in JVM) |
| 2 | Personalized tips | UI `/ai-hair`, `/skin` · `POST /api/v1/beauty-coach/personalize` | Gemini JSON tips | **App OK** (heuristic lists when no live key) |
| 3 | Face attributes | Browser MediaPipe Face Landmarker | Client-only | **Demo in UI** (no Google key needed) |
| 4 | Live slots | WebSocket `/ws` + booking | Spring STOMP | **Product feature** (not Gemini) |
| 5 | Gemini Flash live | Google Generative Language API | `GEMINI_API_KEY` + model `gemini-3.8-flash` | **Key valid** (models list OK); **generateContent hit 429 quota** during this session |

---

## 2. Configuration (required for live Gemini)

In `application.yml` (already wired):

```yaml
app:
  beauty-coach:
    enabled: true
    llm: ${BEAUTY_COACH_LLM:AUTO}
    gemini-api-key: ${GEMINI_API_KEY:}
    gemini-model: ${GEMINI_MODEL:gemini-3.8-flash}
```

**STS / IDE:** edit Run Configuration → Environment:

- `GEMINI_API_KEY=<your-key>`
- `BEAUTY_COACH_LLM=GEMINI`
- `GEMINI_MODEL=gemini-3.8-flash`

**Important model note (tested):**  
`gemini-2.5-flash` returns **404** for new keys: *“no longer available to new users… use models/gemini-3.8-flash”*.  
Defaults in this repo were updated to **`gemini-3.8-flash`**.

Restart the Spring Boot app after setting env vars (IDE must inject env into the `javaw` process).

---

## 3. API tests performed

### 3.1 List models (Google AI) — PASS

```
GET https://generativelanguage.googleapis.com/v1beta/models?key=***
```

Returned flash family including: `gemini-3.8-flash` (recommended), `gemini-flash-latest`, image/lite previews.

### 3.2 Native generateContent — QUOTA (429) this session

```
POST .../models/gemini-3.8-flash:generateContent?key=***
```

After key validation, content generation returned **HTTP 429 Too Many Requests** (free-tier / rate limit). Retry later or enable billing.

### 3.3 OpenAI-compatible chat (same path Spring uses) — QUOTA (429)

```
POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
Authorization: Bearer ***
model: gemini-3.8-flash
```

Also **429** during the same window.

### 3.4 App Beauty Coach chat — PASS (offline path)

```
POST http://localhost:8090/api/v1/beauty-coach/chat
{"message":"I want a short hairstyle for oval face. Give 2 tips.","history":[]}
```

**Result:** HTTP OK. Reply indicates offline / heuristic coach because the running STS process did **not** have `GEMINI_API_KEY` in its environment.

### 3.5 App personalize — PASS (offline path)

```
POST http://localhost:8090/api/v1/beauty-coach/personalize
{
  "faceShapeCategory": "Oval",
  "faceShapeDetail": "ratio ~1.3",
  "faceCount": 1,
  "hairConcern": "thinning at crown",
  "skinOrMakeupNotes": "oily T-zone"
}
```

**Result:** HTTP OK with sample cuts/tips (Soft layers, Side fringe, Textured bob, heat-protectant tips, etc.).

---

## 4. Demo script (5 minutes)

1. Open UI `http://localhost:5173` (or your Vite port).
2. **Coach** `/coach` — ask: *“Oval face, oily scalp, thinning crown — what cut?”*
3. **AI hair** `/ai-hair` — camera or photo → detect face → **Get personalized suggestions**.
4. **Skin** `/skin` — run facial hints → coach tips.
5. Show **booking** live slots (WebSocket) as the “Flash Speed / reactive workspace” story.
6. If `GEMINI_API_KEY` is set and quota allows, coach replies drop the “Offline coach” line and use Flash.

---

## 5. Curl cheatsheet (PowerShell-friendly)

```powershell
$env:GEMINI_API_KEY = "<paste locally — do not commit>"

# List models
Invoke-RestMethod "https://generativelanguage.googleapis.com/v1beta/models?key=$env:GEMINI_API_KEY"

# Native chat (use gemini-3.8-flash)
$body = '{"contents":[{"role":"user","parts":[{"text":"Two short beauty tips for oily scalp."}]}]}'
Invoke-RestMethod -Method POST `
  -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=$env:GEMINI_API_KEY" `
  -ContentType "application/json" -Body $body

# App chat
Invoke-RestMethod -Method POST -Uri "http://localhost:8090/api/v1/beauty-coach/chat" `
  -ContentType "application/json" `
  -Body '{"message":"Suggest a bob for oval face","history":[]}'
```

Or run: `docs/ai-demo/run-ai-tests.ps1` (reads `$env:GEMINI_API_KEY`).

---

## 6. Gaps / next steps for a stronger Flash Speed demo

| Item | Action |
|------|--------|
| Live Gemini in STS | Add env to Run Config + restart (model `gemini-3.8-flash`) |
| 429 quota | Wait / upgrade plan / new project key |
| Background agent loop | Optional job: after booking → Flash summary email draft |
| Multimodal image | Optional: send cropped face thumbnail to Gemini vision (not required for current personalize API) |

---

## 7. Files in this folder

| File | Purpose |
|------|---------|
| `AI-Features-Demo.html` | Visual demo report (open in browser; File → Save As Word `.docx` if needed) |
| `AI-Features-Demo.md` | This document |
| `run-ai-tests.ps1` | Local test harness (env key only) |
| `test-results.txt` | Last automated run snapshot |

**Open HTML in Microsoft Word:** open `AI-Features-Demo.html` → *Save As* → Word Document (`.docx`).
