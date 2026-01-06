import uuid
import os
import json
import logging
import asyncio
from typing import List, Optional
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException, Query, Depends
from fastapi.responses import FileResponse
from app.db.engine import get_db, DBClient
from app.db.models import User, Video
from app.api.routers.auth import get_current_user
from app.api import deps
from app.config import UPLOAD_DIR, CLIPS_DIR
from app.api.security import create_video_access_token, verify_video_access_token
from app.api.api_utils import upload_video, delete_video, delete_clips, search_video_file


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...), 
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    indexing_service = Depends(deps.get_indexing_service),
    db: DBClient = Depends(get_db)
):
    try:
        video_id, file_path = await upload_video(file)
        
        video = Video(
            id=video_id,
            owner_id=current_user.id,
            video_path=str(file_path),
            filename=file.filename,
            status="processing",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.create_video(video)
        
        def run_indexing():
            asyncio.run(indexing_service.index_video(str(file_path), video_id, owner_id=current_user.id))
        
        if background_tasks:
            background_tasks.add_task(run_indexing)
        
        return {"video_id": video_id, "status": "uploaded_and_indexing_started", "filename": file.filename}
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/videos", response_model=List[Video])
async def list_videos(
    current_user: User = Depends(get_current_user),
    db: DBClient = Depends(get_db)
):
    """List all videos belonging to the current user"""
    try:
        return db.list_videos_by_owner(current_user.id)
    except Exception as e:
        logger.error(f"List videos failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/videos/{video_id}")
async def delete_video(
    video_id: str, 
    current_user: User = Depends(get_current_user),
    vector_store = Depends(deps.get_vector_store),
    db: DBClient = Depends(get_db)
):
    try:
        video = db.get_video(video_id)
        if not video:
             raise HTTPException(status_code=404, detail="Video not found")
             
        if video.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this video")

        deleted_files = delete_video(video_id) + delete_clips(video_id)

        # Delete from DB
        db.delete_video(video)
        
        try:
            vector_store.delete_by_video_id(video_id)
        except Exception as e:
            logger.warning(f"Failed to delete embeddings for {video_id}: {e}")
        
        return {"status": "deleted", "video_id": video_id, "deleted_files": deleted_files}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete video failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/videos/{video_id}/retry")
async def retry_indexing(
    video_id: str, 
    background_tasks: BackgroundTasks, 
    current_user: User = Depends(get_current_user),
    indexing_service = Depends(deps.get_indexing_service),
    vector_store = Depends(deps.get_vector_store),
    db: DBClient = Depends(get_db)
):
    try:
        video = db.get_video(video_id)
        if not video:
             raise HTTPException(status_code=404, detail="Video not found")

        if video.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to retry this video")

        video_file = search_video_file(video_id)
        if not video_file:
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Update Status
        video.status = "processing"
        video.error = None
        video.updated_at = datetime.utcnow()
        db.update_video(video)
        
        try:
            vector_store.delete_by_video_id(video_id)
        except Exception as e:
            logger.warning(f"Failed to clear embeddings for {video_id}: {e}")
        
        def run_indexing():
            asyncio.run(indexing_service.index_video(str(video_file), video_id, owner_id=current_user.id))
        
        background_tasks.add_task(run_indexing)
        
        return {"status": "retry_started", "video_id": video_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Retry indexing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/videos/{video_id}/sign")
async def sign_video_url(
    video_id: str, 
    current_user: User = Depends(get_current_user),
    db: DBClient = Depends(get_db)
):
    """Generate a short-lived signed token for video access"""
    try:
        video = db.get_video(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
            
        if video.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this video")
            
        token = create_video_access_token(video_id)
        return {"token": token}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sign video failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/videos/{video_id}")
async def get_video(video_id: str, token: str = Query(...)):
    """Stream a video file (requires signed token)"""
    try:
        if not verify_video_access_token(token, video_id):
            raise HTTPException(status_code=403, detail="Invalid or expired video access token")

        for video_file in UPLOAD_DIR.glob(f"{video_id}.*"):
            if video_file.is_file():
                return FileResponse(
                    path=str(video_file),
                    media_type="video/mp4",
                    filename=video_file.name
                )
        
        raise HTTPException(status_code=404, detail="Video file not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get video failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
