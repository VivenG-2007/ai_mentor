# 🤖 AI Mentor — Intelligent Personal Mentoring Platform

An AI-powered weekly mentoring platform built on the MERN stack. Conducts interactive voice-based sessions with a 3D avatar, evaluates performance using Groq AI, and provides rich analytics and downloadable PDF reports.

---

## ✨ Features

| Category | Features |
|---|---|
| 🎓 **Sessions** | Weekly AI-driven sessions, start/pause/resume, 9 questions across 3 types |
| 🎤 **Voice** | STT via Web Speech API, TTS with SpeechSynthesis, voice/text toggle, live transcript |
| 🧑‍🏫 **3D Avatar** | Three.js humanoid built with React Three Fiber, state-synced animations (idle/speaking/listening/thinking) |
| 🤖 **AI** | Groq LLaMA-3 for question generation, answer evaluation, personality analysis, session summaries |
| 📊 **Analytics** | Line, bar, radar, pie charts powered by Recharts |
| 📄 **Reports** | Auto-generated PDF reports via PDFKit, downloadable from History |
| 🔐 **Auth** | JWT + bcrypt, protected routes, role-based access |
| ⚡ **Real-time** | Socket.IO for live scores, avatar sync, session events |

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, React Three Fiber, Three.js, Recharts, Lucide React

**Backend:** Node.js, Express.js, Socket.IO, node-cron, PDFKit

**Database:** MongoDB with Mongoose

**AI:** Groq SDK (LLaMA 3)

**Auth:** JWT, bcryptjs

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone & Install

```bash
git clone https://github.com/your-username/ai-mentor.git
cd ai-mentor

# Install root dev tools
npm install

# Install all dependencies
npm run install:all
```

### 2. Configure Environment

**Server:**
```bash
cd server
cp .env.example .env
# Edit .env with your values:
#   MONGODB_URI=your-mongodb-uri
#   JWT_SECRET=your-secret-key
#   GROQ_API_KEY=your-groq-key
```

**Client:**
```bash
cd client
cp .env.example .env.local
# Edit .env.local if backend runs on a different port
```

### 3. Run in Development

```bash
# From root — runs both server and client concurrently
npm run dev

# Or separately:
npm run dev:server   # Express on http://localhost:5000
npm run dev:client   # Vite on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## 📁 Project Structure

```
ai-mentor/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Avatar/
│   │   │   │   ├── AvatarScene.jsx    # Three.js 3D avatar
│   │   │   │   └── VoiceControls.jsx  # STT/TTS controls
│   │   │   ├── Charts/
│   │   │   │   └── index.jsx          # Recharts components
│   │   │   └── UI/
│   │   │       ├── Layout.jsx         # Sidebar + nav
│   │   │       └── LoadingScreen.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Global auth state
│   │   ├── hooks/
│   │   │   └── useVoice.js            # STT/TTS hook
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Session.jsx            # Core mentoring UI
│   │   │   ├── History.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   └── services/
│   │       ├── api.js                 # Axios instance
│   │       └── socket.js             # Socket.IO client
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Express backend
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   └── index.js            # Question, Answer, Report
│   ├── routes/
│   │   ├── auth.js
│   │   ├── sessions.js
│   │   ├── questions.js        # Also exports answersRouter
│   │   ├── reports.js
│   │   └── dashboard.js        # Also exports analyticsRouter
│   ├── services/
│   │   ├── groqService.js      # AI integration
│   │   ├── pdfService.js       # PDFKit report generation
│   │   ├── socketHandlers.js   # Socket.IO events
│   │   └── scheduler.js        # node-cron weekly scheduling
│   ├── middleware/
│   │   └── auth.js             # JWT protection
│   ├── reports/                # Generated PDFs (auto-created)
│   └── server.js
│
└── package.json                # Root scripts
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/dashboard` | Dashboard summary |
| GET | `/api/sessions` | List sessions (paginated) |
| POST | `/api/sessions/start` | Start/resume session + generate questions |
| PUT | `/api/sessions/:id/pause` | Pause session |
| PUT | `/api/sessions/:id/complete` | Complete session |
| POST | `/api/answers` | Submit + auto-evaluate answer |
| GET | `/api/answers/session/:id` | Get answers for session |
| POST | `/api/reports/generate/:sessionId` | Generate report + PDF |
| GET | `/api/reports` | List reports |
| GET | `/api/analytics` | Chart data |
| GET | `/reports/:filename` | Download PDF file |

---

## ⚡ Socket.IO Events

| Client → Server | Server → Client | Description |
|---|---|---|
| `voice:start` | `avatar:listening` | Mic activated |
| `voice:stop` | `avatar:idle` | Mic deactivated |
| `tts:start` | `avatar:speaking` | TTS started |
| `tts:stop` | `avatar:idle` | TTS ended |
| `answer:submitted` | `score:updated` | Answer evaluated |
| `session:pause` | `session:paused` | Session paused |

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd client
npm run build
# Deploy dist/ to Vercel
# Set VITE_API_URL to your Render/Railway backend URL
```

**vercel.json:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Backend → Render

1. Create a **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Set **Root Directory** to `server`
4. **Build command:** `npm install`
5. **Start command:** `node server.js`
6. Add environment variables:
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — Strong random secret
   - `GROQ_API_KEY` — Your Groq key
   - `CLIENT_URL` — Your Vercel frontend URL
   - `NODE_ENV` — `production`

### Database → MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist `0.0.0.0/0` (all IPs) for Render
4. Get connection string and set as `MONGODB_URI`

---

## 🔐 Security Features

- Passwords hashed with **bcrypt** (salt rounds: 12)
- **JWT** tokens with 30-day expiry
- **Rate limiting** — 200 req/15min per IP
- **CORS** restricted to client origin
- Input validation via **express-validator**
- Environment variables via **dotenv**

---

## 🗓️ Weekly Session Scheduling

Sessions are auto-scheduled every **Monday at 9:00 AM** via `node-cron`. Users can also manually start a session at any time from the dashboard or `/session` page. Only one session is created per week per user.

---

## 🤖 Groq AI Integration

The app uses Groq's **LLaMA 3** model (8B) for:

1. **Question Generation** — Tailored subjective, English, and psychometric questions
2. **Answer Evaluation** — Scores 0–100 with feedback, strengths, and improvements
3. **Session Summary** — Overall feedback and next-week goals
4. **Personality Analysis** — OCEAN trait scores from psychometric responses

All API calls include fallback mock responses so the app works even without a Groq key (great for development).

---

## 📄 License

MIT — free to use and modify.

---

## 🙏 Acknowledgements

- [Groq](https://groq.com) for blazing-fast LLM inference
- [React Three Fiber](https://r3f.docs.pmnd.rs) for Three.js/React integration
- [Recharts](https://recharts.org) for beautiful chart components
- [Framer Motion](https://www.framer.com/motion) for smooth animations
"# ai_mentor" 
