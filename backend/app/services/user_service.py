from starlette.concurrency import run_in_threadpool

from app.schemas.discovery import ContactView, FriendRequestView, UserView
from app.services.firebase_service import FirebaseService


class UserService:
    def __init__(self, firebase_service: FirebaseService) -> None:
        self._firebase = firebase_service

    async def search_users(self, query: str, current_user_id: str, limit: int = 15) -> list[UserView]:
        return await run_in_threadpool(self._firebase.search_users, query, current_user_id, limit)

    async def get_recent_contacts(self, user_id: str, limit: int = 15) -> list[ContactView]:
        return await run_in_threadpool(self._firebase.get_recent_contacts, user_id, limit)

    async def upsert_user(
        self,
        user_id: str,
        username: str,
        preferred_language: str,
        avatar: str | None = None,
    ):
        return await run_in_threadpool(
            self._firebase.upsert_user,
            user_id,
            username,
            preferred_language,
            avatar,
            None,
        )

    async def send_friend_request(self, sender_id: str, receiver_id: str) -> FriendRequestView:
        return await run_in_threadpool(self._firebase.create_friend_request, sender_id, receiver_id)

    async def get_pending_friend_requests(self, user_id: str, limit: int = 25) -> list[FriendRequestView]:
        return await run_in_threadpool(self._firebase.get_pending_friend_requests, user_id, limit)

    async def accept_friend_request(self, request_id: str, actor_id: str) -> FriendRequestView:
        return await run_in_threadpool(self._firebase.resolve_friend_request, request_id, actor_id, True)

    async def reject_friend_request(self, request_id: str, actor_id: str) -> FriendRequestView:
        return await run_in_threadpool(self._firebase.resolve_friend_request, request_id, actor_id, False)
