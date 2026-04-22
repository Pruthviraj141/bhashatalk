# System Architecture

## Overview
BhashaTalk is a real-time multilingual chat system supporting English (`en`), Hindi (`hi`), and Marathi (`mr`).

## Components
- **FastAPI Backend** — WebSocket + REST API and translation pipeline
- **Firestore** — Primary data store for users, relationships, chats, and messages
- **NLLB-200** — Facebook multilingual translation model (`facebook/nllb-200-distilled-600M`)
- **React Frontend** — desktop-first PWA UI with virtualized message rendering

## Data Flow
1. User sends a chat payload via WebSocket (`/ws/{user_id}`)
2. Backend validates payload, authorizes sender, and persists message in Firestore
3. Translation service performs language conversion when sender/receiver language differs
4. Message is broadcast to receiver and acknowledged back to sender

## Environment Variables
See `.env.example` in backend/frontend and setup notes in `SETUP_FIREBASE.md`.

## Scaling Notes
- Translation inference is cached in-memory for repeated `(text, source, target)` tuples
- Firestore indexes are defined in `firestore.indexes.json`
- WebSocket manager is currently in-process; move to Redis pub/sub for multi-instance scaling
