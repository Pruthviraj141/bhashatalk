<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=00BFA5,0B1F3A&height=220&section=header&text=BhashaTalk&fontSize=62&fontColor=FFFFFF&animation=fadeIn&fontAlignY=38&desc=Real-time%20multilingual%20chat%20for%20English%2C%20Hindi%2C%20and%20Marathi&descAlignY=62&descAlign=50" width="100%"/>
  <img src="https://readme-typing-svg.demolab.com?font=Outfit&weight=700&size=28&pause=1100&color=00BFA5&center=true&vCenter=true&multiline=false&random=false&width=920&height=60&lines=A+real-time+multilingual+chat+platform;FastAPI+%2B+React+with+WebSocket+delivery;Groq-powered+translation+across+en%2Fhi%2Fmr;Firestore-backed+history+and+friend+graph;Open+source+chat+that+feels+native+on+mobile" alt="Typing SVG"/>
</div>

<div align="center">

![Version](https://img.shields.io/badge/version-0.0.0-00BFA5?style=for-the-badge&logo=semanticrelease&logoColor=white)
![License](https://img.shields.io/badge/license-NOASSERTION-0B1F3A?style=for-the-badge&logo=opensourceinitiative&logoColor=white)
![CI](https://img.shields.io/badge/CI-not%20configured-145374?style=for-the-badge&logo=githubactions&logoColor=white)

<br/>

![Python](https://img.shields.io/badge/python-3.11-00BFA5?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/fastapi-0.111%2B-0E7490?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/react-18.3-0EA5E9?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-5.4-2563EB?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-5.3-0EA5E9?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/firestore-firebase-FF8A00?style=for-the-badge&logo=firebase&logoColor=white)
![Groq](https://img.shields.io/badge/groq-translation-1E293B?style=for-the-badge&logo=openai&logoColor=white)

<br/>

![Stars](https://img.shields.io/github/stars/Pruthviraj141/bhashatalk?style=for-the-badge&color=00BFA5&logo=github)
![Forks](https://img.shields.io/github/forks/Pruthviraj141/bhashatalk?style=for-the-badge&color=00BFA5&logo=github)
![Issues](https://img.shields.io/github/issues/Pruthviraj141/bhashatalk?style=for-the-badge&color=00BFA5)
![PRs](https://img.shields.io/badge/PRs-welcome-16A34A?style=for-the-badge&logo=git&logoColor=white)

</div>

<img src="https://capsule-render.vercel.app/api?type=soft&color=00BFA5,0B1F3A&height=2" width="100%"/>

## Project Intelligence Snapshot

```text
PROJECT NAME          : BhashaTalk
TAGLINE / PURPOSE     : Real-time multilingual chat that auto-translates messages between English, Hindi, and Marathi to reduce language barriers in conversation.
PRIMARY LANGUAGE      : TypeScript (frontend), Python 3.11 (backend)
SECONDARY LANGUAGES   : HTML, CSS, JSON, Markdown
FRAMEWORK(S)          : React, FastAPI, Vite, Tailwind CSS, Zustand
PACKAGE MANAGER       : npm (frontend), pip (backend)
DATABASE / STORAGE    : Google Firestore
CLOUD / INFRA         : Firebase (Firestore + Admin SDK), Groq API
TESTING FRAMEWORK     : End-to-end smoke script via asyncio + websockets + urllib
CI/CD PLATFORM        : Not configured yet (no .github/workflows)
LICENSE               : NOASSERTION (no LICENSE file detected)
CURRENT VERSION       : 0.0.0 (frontend package version)
INSTALL COMMAND       : npm --prefix frontend install ; pip install -r backend/requirements.txt
QUICK START COMMAND   : backend: uvicorn app.main:app --reload ; frontend: npm --prefix frontend run dev
KEY FEATURES          : realtime WS chat, translation pipeline, delivery status updates, friend graph, Firestore history, PWA-enabled frontend
API / CLI USAGE       : REST endpoints under /api/* plus WebSocket /ws/{user_id}
ENVIRONMENT VARS      : VITE_WS_HOST, VITE_API_BASE_URL, APP_NAME, APP_ENV, LOG_LEVEL, LOG_FORMAT, CORS_ALLOW_ORIGINS, FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, FIRESTORE_DATABASE, GROQ_API_KEY, GROQ_MODEL
CONTRIBUTORS COUNT    : 1 unique contributor (Pruthviraj141)
STAR COUNT TARGET     : Growing
```

<img src="https://capsule-render.vercel.app/api?type=slice&color=0B1F3A,00BFA5&height=2" width="100%"/>

## What is BhashaTalk?

BhashaTalk solves a simple but painful problem: real-time chat often breaks down when participants prefer different languages. Instead of forcing one side to switch language or rely on external tools, BhashaTalk streams each message through a translation pipeline and delivers a language-friendly version to each participant while preserving original text context.

The platform combines a FastAPI WebSocket backend, Firestore persistence, and a React mobile-first client. It is designed for developers and student builders who want production-like messaging mechanics such as connection recovery, delivery status transitions, chat history retrieval, and friend-request-gated conversations. The result is a practical multilingual chat foundation you can run locally, extend quickly, and deploy when needed.

<img src="https://capsule-render.vercel.app/api?type=rect&color=00BFA5,145374&height=2" width="100%"/>

## Features

<div align="center">
<table>
  <tr>
    <td align="center" width="33%">
      <img src="https://img.icons8.com/fluency/64/chat-message.png" width="48"/>
      <br/><b>Real-time WebSocket Messaging</b>
      <br/><sub>Bidirectional chat over <code>/ws/{user_id}</code> with dedicated event envelopes.</sub>
    </td>
    <td align="center" width="33%">
      <img src="https://img.icons8.com/fluency/64/language-skill.png" width="48"/>
      <br/><b>Auto Translation (en/hi/mr)</b>
      <br/><sub>Groq-backed translation service with normalization and fallback-safe behavior.</sub>
    </td>
    <td align="center" width="33%">
      <img src="https://img.icons8.com/fluency/64/checkmark--v1.png" width="48"/>
      <br/><b>Delivery Status Pipeline</b>
      <br/><sub>Message lifecycle events include sent, delivered, and failed updates to sender.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <img src="https://img.icons8.com/fluency/64/conference-call.png" width="48"/>
      <br/><b>Friend Request Workflow</b>
      <br/><sub>Search, request, accept/reject flow with chat initiation only for valid pairs.</sub>
    </td>
    <td align="center" width="33%">
      <img src="https://img.icons8.com/fluency/64/database.png" width="48"/>
      <br/><b>Firestore-backed History</b>
      <br/><sub>Persistent chat history with paged REST retrieval under <code>/api/chats/*</code>.</sub>
    </td>
    <td align="center" width="33%">
      <img src="https://img.icons8.com/fluency/64/smartphone-tablet.png" width="48"/>
      <br/><b>PWA-ready Frontend</b>
      <br/><sub>Vite PWA integration, cached assets, and mobile-first interaction design.</sub>
    </td>
  </tr>
</table>
</div>

<img src="https://capsule-render.vercel.app/api?type=egg&color=145374,00BFA5&height=2" width="100%"/>

## Preview

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=venom&color=0B1F3A,00BFA5&height=80&section=header&text=Dark%20Mode%20Ready&fontSize=24&fontColor=ffffff" />
  <source media="(prefers-color-scheme: light)" srcset="https://capsule-render.vercel.app/api?type=venom&color=00BFA5,E6FFFA&height=80&section=header&text=Light%20Mode%20Ready&fontSize=24&fontColor=0B1F3A" />
  <img src="https://capsule-render.vercel.app/api?type=venom&color=0B1F3A,00BFA5&height=80&section=header&text=Mode%20Adaptive%20UI&fontSize=24&fontColor=ffffff" alt="Theme banner" width="85%"/>
</picture>

<br/>

<img src="frontend/src/assets/hero.png" alt="BhashaTalk preview" width="85%"/>

</div>

<img src="https://capsule-render.vercel.app/api?type=shark&color=0B1F3A,00BFA5&height=2" width="100%"/>

## Tech Stack

<div align="center">

[![My Skills](https://skillicons.dev/icons?i=react,ts,tailwind,vite,fastapi,py,firebase,git,github,vscode&theme=dark&perline=8)](https://skillicons.dev)

</div>

| Category | Technology |
|----------|------------|
| Language | TypeScript, Python 3.11 |
| Frontend | React 18.3, Vite 5.3, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| Data Store | Firestore (Firebase Admin SDK) |
| Translation | Groq API (`llama-3.1-8b-instant` default) |
| Realtime | Native WebSocket endpoint + reconnect-aware client |
| State Management | Zustand + persisted preferences |
| PWA | vite-plugin-pwa + Workbox runtime caching |

<img src="https://capsule-render.vercel.app/api?type=cylinder&color=00BFA5,0B1F3A&height=2" width="100%"/>

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- Python >= 3.11
- Firebase project + Firestore enabled
- Groq API key for translation

### Installation

#### Option A - Workspace Setup (Recommended)

```bash
npm --prefix frontend install
pip install -r backend/requirements.txt
```

#### Option B - From Source

```bash
# Clone
git clone https://github.com/Pruthviraj141/bhashatalk.git
cd bhashatalk

# Install frontend and backend dependencies
npm --prefix frontend install
pip install -r backend/requirements.txt

# Configure frontend env
cp frontend/.env.example frontend/.env

# Configure backend env manually (backend/.env)
# Required variables at minimum:
# FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/service-account.json
# GROQ_API_KEY=your_groq_key
# GROQ_MODEL=llama-3.1-8b-instant

# Start backend (terminal 1)
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Start frontend (terminal 2, repo root)
npm --prefix frontend run dev -- --host 127.0.0.1 --port 5173
```

<img src="https://capsule-render.vercel.app/api?type=soft&color=145374,00BFA5&height=2" width="100%"/>

## Usage

### Basic Example (REST + login)

```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}'
```

### Advanced Example (WebSocket message envelope)

```json
{
  "type": "message",
  "payload": {
    "chat_id": "chat_abc123",
    "client_message_id": "f42f1e0b",
    "sender_id": "user_en_1",
    "receiver_id": "user_hi_2",
    "message": "Hello friend",
    "sender_lang": "en",
    "receiver_lang": "hi"
  }
}
```

### Configuration Example (frontend)

```env
# frontend/.env
VITE_WS_HOST=
VITE_API_BASE_URL=
```

<img src="https://capsule-render.vercel.app/api?type=slice&color=00BFA5,0B1F3A&height=2" width="100%"/>

## Architecture

```mermaid
graph TD
    A[React PWA Client] -->|HTTP /api| B[FastAPI REST Routes]
    A -->|WS /ws/{user_id}| C[WebSocket Route]
    C --> D[Message Pipeline Service]
    D --> E[Translation Service (Groq)]
    D --> F[Message Service]
    F --> G[(Firestore)]
    B --> G
    B --> H[Auth/User/Chat Services]
    H --> G
    style A fill:#00BFA5,color:#fff
    style B fill:#145374,color:#fff
    style C fill:#0B1F3A,color:#fff
    style G fill:#1F2937,color:#fff
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=145374,00BFA5&height=2" width="100%"/>

## Configuration

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `VITE_WS_HOST` | empty | No | Explicit WebSocket host; if empty, client derives from current origin or API base URL. |
| `VITE_API_BASE_URL` | empty | No | Absolute API origin for REST requests; empty uses same-origin proxy in dev. |
| `APP_NAME` | `NLP Translation API` | No | FastAPI app title and service identity. |
| `APP_ENV` | `development` | No | Environment mode label for runtime behavior. |
| `LOG_LEVEL` | `INFO` | No | Backend log verbosity. |
| `LOG_FORMAT` | `console` | No | Log format (`console` or `json`). |
| `CORS_ALLOW_ORIGINS` | localhost origins | No | Comma-separated CORS allowlist. |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | none | Yes* | Path to Firebase service account JSON (recommended secure method). |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | none | Yes* | Raw JSON credentials alternative (secret manager scenario). |
| `FIRESTORE_DATABASE` | `(default)` | No | Firestore database name. |
| `GROQ_API_KEY` | none | Yes | API key used for translation requests. |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | No | Groq model id for translation completions. |

*Provide one of `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON`.

<img src="https://capsule-render.vercel.app/api?type=egg&color=00BFA5,145374&height=2" width="100%"/>

## Contributing

Contributions are welcome and appreciated.

1. Fork the project.
2. Create your feature branch (`git checkout -b feat/amazing-feature`).
3. Commit your changes (`git commit -m "feat: add amazing feature"`).
4. Push to the branch (`git push origin feat/amazing-feature`).
5. Open a Pull Request.

A dedicated `CONTRIBUTING.md` is not present yet; use this workflow and open an issue for major proposals before implementation.

<img src="https://capsule-render.vercel.app/api?type=shark&color=0B1F3A,00BFA5&height=2" width="100%"/>

## Repository Stats

<div align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=Pruthviraj141&show_icons=true&theme=github_dark&hide_border=true&bg_color=00000000&title_color=00BFA5&icon_color=00BFA5&text_color=A7F3D0" height="160"/>
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=Pruthviraj141&layout=compact&theme=github_dark&hide_border=true&bg_color=00000000&title_color=00BFA5&text_color=A7F3D0" height="160"/>
</div>

<img src="https://capsule-render.vercel.app/api?type=cylinder&color=145374,00BFA5&height=2" width="100%"/>

## Roadmap

- [x] REST auth and user onboarding
- [x] Friend request flow and chat initiation
- [x] Real-time WebSocket message pipeline with delivery statuses
- [x] Firestore-backed message persistence and chat history retrieval
- [ ] Add formal CI workflow (lint, type-check, smoke tests)
- [ ] Add complete backend `.env.example` and deployment templates
- [ ] Add unread counters/read receipts synchronization across sessions

See open issues: https://github.com/Pruthviraj141/bhashatalk/issues

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=00BFA5,0B1F3A&height=120&section=footer" width="100%"/>

Built with care by Pruthviraj141

![Visitor Count](https://profile-counter.glitch.me/bhashatalk/count.svg)

[![GitHub](https://img.shields.io/badge/GitHub-Pruthviraj141-0B1F3A?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Pruthviraj141)
[![Repository](https://img.shields.io/badge/Repo-bhashatalk-00BFA5?style=for-the-badge&logo=git&logoColor=white)](https://github.com/Pruthviraj141/bhashatalk)

<sub>Star this repository if it helped you build multilingual chat faster.</sub>

</div>
