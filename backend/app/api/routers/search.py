import logging
from fastapi import APIRouter, Query, Depends, HTTPException
from app.db.models import User
from app.api.routers.auth import get_current_user
from app.services.search import SearchService
from app.services.structs import Moment
from app.api import deps

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/search", response_model=list[Moment])
async def search(
    q: str = Query(...), 
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    search_service: SearchService = Depends(deps.get_search_service)
):
    try:
        results = search_service.search_videos(q, owner_id=current_user.id, limit=limit)
        return results
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
