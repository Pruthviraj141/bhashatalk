from fastapi import APIRouter, Depends

from app.api.deps.services import get_firebase_service
from app.core.logging import get_logger
from app.services.firebase_service import FirebaseService

router = APIRouter(prefix='/health', tags=['health'])
logger = get_logger(__name__)


@router.get('')
async def health_check(firebase: FirebaseService = Depends(get_firebase_service)) -> dict[str, object]:
    """Liveness probe — returns 200 if critical services are reachable."""
    status: dict[str, object] = {
        'status': 'healthy',
        'services': {
            'firebase': 'unknown',
            'translation': 'unknown',
        },
    }
    try:
        await firebase.ping()
        services = status['services']
        if isinstance(services, dict):
            services['firebase'] = 'ok'
            services['translation'] = 'ok'
    except Exception as exc:
        logger.error('Firebase health check failed', error=str(exc))
        services = status['services']
        if isinstance(services, dict):
            services['firebase'] = 'degraded'
            services['translation'] = 'unknown'
        status['status'] = 'degraded'

    return status


@router.get('/ready')
async def readiness_probe() -> dict[str, bool]:
    """Readiness probe — for orchestrators."""
    return {'ready': True}
