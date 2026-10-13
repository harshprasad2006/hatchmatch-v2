# HatchMatch — Frontend

A human-designed, minimal, and fully functional frontend built for the **HatchMatch** platform. HatchMatch bridges messy, multilingual grassroots Indian problems with student innovators and tests ideas against real-world prior art (products, OpenAlex research papers, and Google Patents) to prevent redundant effort.

---

## 1. Design System & Palette

Crafted with an editorial, trustworthy, restrained aesthetic:

| Color | Hex | Usage |
|---|---|---|
| **White** | `#FFFFFF` | Primary cards, elevated surfaces, clean background containers |
| **Deep Charcoal** | `#29272D` | High-contrast typography, brand mark, dark badges |
| **Muted Violet** | `#8274A6` | Primary actions, brand accents, active navigation tabs |
| **Warm Taupe** | `#B5A394` | Subtle borders, secondary surfaces, builder pathway accents |

---

## 2. Integrated Backend API Endpoints

The frontend strictly integrates with the actual backend endpoints defined in the HatchMatch API contract (`app/main.py`):

| Endpoint | Method | Component / Page | Description |
|---|---|---|---|
| `/api/v1/health` | `GET` | `Navbar.tsx` | Live heartbeat monitoring backend availability |
| `/api/v1/problems` | `POST` | `ProblemSubmitPage.tsx` | Structures unstructured text (Hindi, Marathi, English, Hinglish) and retrieves existing solutions |
| `/api/v1/problems/{id}/share` | `POST` | `ProblemCardView.tsx` | Shares an existing problem to the public board |
| `/api/v1/problems` | `GET` | `ProblemsBoardPage.tsx` | Fetches verified shared problems (`shared == true`) |
| `/api/v1/ideas/check` | `POST` | `BuilderCheckPage.tsx` | Analyzes idea novelty, searches prior art, and computes Uniqueness Score |
| `/api/v1/reports/{id}` | `GET` | `ReportLookupPage.tsx` | Retrieves a previously stored novelty report from Firestore |
| `/api/v1/reports` | `POST` | `services/api.ts` | Saves a complete IdeaReport to Firestore |

---

## 3. Technology Stack

- **Framework**: React 19 with TypeScript
- **Bundler & Dev Server**: Vite
- **Icons**: Lucide React (clean line icons)
- **Styling**: Modern, semantic CSS with custom design tokens (`index.css`)
- **API Client**: Modular fetch wrapper with typed FastAPI error handling (`src/services/api.ts`)

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- npm / pnpm / yarn
- Running HatchMatch FastAPI backend (default `http://127.0.0.1:8000`)

### Installation
From the project root:
```powershell
cd frontend
npm install
```

### Development Mode
```powershell
npm run dev
```
The app will start at `http://localhost:5173`.

Vite is configured with a built-in proxy:
- Requests to `/api/...` are automatically forwarded to `http://127.0.0.1:8000/api/...`
- This completely avoids browser CORS restrictions during development without requiring any backend configuration changes.

### Production Build
```powershell
npm run build
npm run preview
```

---

## 5. Configuration & Environment Variables

Create a `.env` or `.env.local` inside `frontend/` if you need to point to a custom backend host or reverse proxy:

```env
# Optional: Set custom backend base URL (defaults to same-origin dev proxy if unset)
VITE_API_BASE_URL=http://127.0.0.1:8000
```

> **Security Note:** Never add server-side secrets, Firebase service account keys, or Gemini API keys to client-side code or `.env` files inside `frontend/`.

---

## 6. Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── ExistingSolutionsList.tsx   # Verified solutions with real links
│   │   ├── FeatureComparisonTable.tsx  # Core feature novelty matrix
│   │   ├── Footer.tsx                  # Editorial footer & system integrity
│   │   ├── MatchesList.tsx             # Filterable prior art (Products, Papers, Patents)
│   │   ├── Navbar.tsx                  # Header, navigation & live backend health badge
│   │   ├── ProblemCardView.tsx         # Structured dual-language problem card
│   │   └── UniquenessScoreGauge.tsx    # Radial score meter & exact deductions
│   ├── pages/
│   │   ├── BuilderCheckPage.tsx        # Idea submission & novelty analysis
│   │   ├── HomePage.tsx                # Overview & honest access model
│   │   ├── ProblemsBoardPage.tsx       # Real problems feed with search/filters
│   │   ├── ProblemSubmitPage.tsx       # Multilingual grassroots problem capture
│   │   └── ReportLookupPage.tsx        # Retrieve stored reports by ID
│   ├── services/
│   │   └── api.ts                      # Clean API service layer
│   ├── types/
│   │   └── api.ts                      # Exact TypeScript types matching backend schemas
│   ├── App.tsx                         # Main tab router & handoff controller
│   ├── index.css                       # Design tokens and responsive styles
│   └── main.tsx                        # React application entry point
├── index.html                          # Branded HTML with responsive viewport
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # TypeScript compiler options
└── vite.config.ts                      # Vite configuration with /api proxy
```

---

## 7. Backend Compatibility & Operational Notes

1. **Authentication**: The existing backend has no user authentication endpoints or session tokens. The frontend honestly reflects this through open, permissionless access rather than fabricating login screens or fake credentials.
2. **CORS**: `app/main.py` currently does not include FastAPI `CORSMiddleware`. For local development, the Vite dev server proxy in `vite.config.ts` handles all cross-origin requests seamlessly. If deploying to production with separate domains, the backend team will need to enable `CORSMiddleware` in `app/main.py`.
3. **Database Availability**: If Firestore credentials (`FIREBASE_KEY_PATH`) are missing, the backend uses in-memory/mock persistence. The frontend gracefully handles both situations.
4. **AI Quota**: In the event that Gemini free-tier daily quotas are reached, the backend returns HTTP 502. The frontend displays user-friendly error banners explaining the quota limitation.
