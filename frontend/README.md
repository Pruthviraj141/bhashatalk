# Real-time Multilingual Chat Frontend

Mobile-first chat interface built with React, TypeScript, and Tailwind CSS.

## Features

- WhatsApp/Telegram-style UI
- Chat list + chat detail layout
- Primary translated text + secondary original text
- Real-time messaging over FastAPI WebSocket (`/ws/{user_id}`)
- Touch-friendly spacing, rounded bubbles, smooth message animations

## Configuration

Create `.env` from `.env.example` and set:

- `VITE_WS_HOST=localhost:8000`

Use your backend host/port in production.

## Run

1. Install dependencies
2. Start dev server

Build command is validated and working:

- `npm run build`

## UI Architecture

- `src/components/ChatList.tsx` — conversation list screen
- `src/components/ChatHeader.tsx` — chat top bar
- `src/components/MessageBubble.tsx` — translated + original bubble
- `src/components/MessageInput.tsx` — bottom fixed message input
- `src/services/chatSocket.ts` — WebSocket client integration
- `src/types/chat.ts` — shared chat types
