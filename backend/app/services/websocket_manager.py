import asyncio
from typing import Set

from fastapi import WebSocket, WebSocketDisconnect

from app.core.logging import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, WebSocket] = {}

        self._chat_members: dict[str, set[str]] = {}
        self._user_chats: dict[str, set[str]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()

        stale_socket: WebSocket | None
        async with self._lock:
            stale_socket = self._connections.get(user_id)
            self._connections[user_id] = websocket

        if stale_socket is not None and stale_socket is not websocket:
            logger.info("WebSocket reconnect replacing old session", user_id=user_id)
            try:
                await stale_socket.close(code=1001)
            except Exception:
                pass

        logger.info("WebSocket connected", user_id=user_id, total=len(self._connections))

    async def join_chat(self, chat_id: str, user_id: str) -> None:
        async with self._lock:
            members = self._chat_members.setdefault(chat_id, set())
            members.add(user_id)

            user_rooms = self._user_chats.setdefault(user_id, set())
            user_rooms.add(chat_id)

    async def disconnect(self, user_id: str) -> None:
        async with self._lock:
            self._connections.pop(user_id, None)

            chat_ids = self._user_chats.pop(user_id, set())
            for chat_id in chat_ids:
                members = self._chat_members.get(chat_id)
                if members is None:
                    continue
                members.discard(user_id)
                if not members:
                    self._chat_members.pop(chat_id, None)

            logger.info("WebSocket disconnected", user_id=user_id, total=len(self._connections))

    async def is_connected(self, user_id: str) -> bool:
        async with self._lock:
            return user_id in self._connections

    async def send_to_user(self, user_id: str, payload: dict) -> bool:
        async with self._lock:
            ws = self._connections.get(user_id)

        if ws is None:
            return False

        try:
            await ws.send_json(payload)
            return True
        except (WebSocketDisconnect, RuntimeError):
            await self.disconnect(user_id)
            return False

    async def send_personal_message(self, user_id: str, message: dict) -> None:
        sent = await self.send_to_user(user_id, message)
        if not sent:
            logger.debug("WebSocket send skipped; user offline", user_id=user_id)

    async def broadcast_to_chat(self, chat_id: str, message: dict, participant_ids: list[str] | None = None) -> None:
        if participant_ids is None:
            async with self._lock:
                participant_ids = list(self._chat_members.get(chat_id, set()))

        tasks = [self.send_to_user(uid, message) for uid in participant_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        failed = sum(1 for result in results if result is False or isinstance(result, Exception))
        if failed:
            logger.warning("Broadcast partial failure", chat_id=chat_id, failed=failed)

    async def active_connections(self, chat_id: str | None = None) -> int:
        async with self._lock:
            if chat_id is not None:
                return len(self._chat_members.get(chat_id, set()))
            return len(self._connections)

    @property
    def active_users(self) -> Set[str]:
        return set(self._connections.keys())
