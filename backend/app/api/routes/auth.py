from fastapi import APIRouter, Depends, HTTPException

from app.api.deps.services import get_auth_service
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.services.auth_service import AuthService
from app.services.firebase_service import FirebaseConflictError, FirebaseServiceError

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        user = await auth_service.register(
            username=payload.username,
            password=payload.password,
            preferred_language=payload.preferred_language,
            avatar=payload.avatar,
        )
        return AuthResponse(user=user)
    except FirebaseConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        user = await auth_service.login(username=payload.username, password=payload.password)
        return AuthResponse(user=user)
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
