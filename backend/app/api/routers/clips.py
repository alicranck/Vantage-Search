import logging
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import FileResponse
from app.api.security import verify_video_access_token
from app.config import CLIPS_DIR

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/clips/{clip_id}")
async def get_clip(clip_id: str, token: str = Query(...)):
    """Serve a cut video clip (requires signed token)"""
    try:
        parts = clip_id.rsplit('_', 2)
        if len(parts) < 3:
             raise HTTPException(status_code=400, detail="Invalid clip ID format")
        
        video_id = parts[0]
        
        if not verify_video_access_token(token, video_id):
             raise HTTPException(status_code=403, detail="Invalid or expired video access token")

        clip_path = CLIPS_DIR / f"{clip_id}.mp4"
        if clip_path.exists():
            return FileResponse(
                path=str(clip_path),
                media_type="video/mp4",
                filename=f"{clip_id}.mp4"
            )
        raise HTTPException(status_code=404, detail="Clip not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get clip failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
