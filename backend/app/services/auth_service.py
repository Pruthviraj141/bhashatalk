from starlette.concurrency import run_in_threadpool

from app.schemas.discovery import UserView
from app.services.firebase_service import FirebaseService


class AuthService:
    def __init__(self, firebase_service: FirebaseService) -> None:
        self._firebase = firebase_service

    async def register(
        self,
        username: str,
        password: str,
        preferred_language: str,
        avatar: str | None = None,
    ) -> UserView:
        return await run_in_threadpool(
            self._firebase.register_user,
            username,
            password,
            preferred_language,
            avatar,
        )

    async def login(self, username: str, password: str) -> UserView:
        return await run_in_threadpool(self._firebase.login_user, username, password)
