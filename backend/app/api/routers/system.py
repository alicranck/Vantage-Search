import logging
from fastapi import APIRouter, Depends, HTTPException
from app.db.models import User
from app.api.routers.auth import get_current_user
from app.db.engine import get_db, DBClient
from app.api import deps

logger = logging.getLogger(__name__)
router = APIRouter()


@router.delete("/reset")
async def reset_db(current_user: User = Depends(get_current_user)):
    return {"status": "reset_disabled_for_multiuser"}

# @router.post("/sync")
# async def sync_state(
#     current_user: User = Depends(get_current_user),
#     db: DBClient = Depends(get_db),
#     vector_store = Depends(deps.get_vector_store)
# ):
#     """
#     Scans the vector store and removes any embeddings associated with videos
#     that do not exist in the SQL database (Ghost Data).
#     """
#     try:        
#         logger.info("Starting Sync...")
    
        
#         return {"status": "sync_not_fully_implemented_use_hard_reset_if_needed"}

@router.get("/stats")
async def get_system_stats(
    current_user: User = Depends(get_current_user),
    vector_store = Depends(deps.get_vector_store)
):
    try:
        count = vector_store.count()
        return {"total_frames_analyzed": count}
    
    except Exception as e:
        logger.error(f"Stats failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
