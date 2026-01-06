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
from app.db.models import User
from app.api.routers.auth import get_current_user
from app.api import deps
from app.core.config import UPLOAD_DIR, METADATA_DIR, CLIPS_DIR
from app.core.security import create_video_access_token, verify_video_access_token

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...), 
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    indexing_service = Depends(deps.get_indexing_service)
):
    try:
        file_extension = os.path.splitext(file.filename)[1]
        video_id = str(uuid.uuid4())
        file_name = f"{video_id}{file_extension}"
        file_path = UPLOAD_DIR / file_name
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
            
        logger.info(f"Video uploaded: {file_path}")
        
        metadata = {
            "original_filename": file.filename,
            "uploaded_at": datetime.utcnow().isoformat(),
            "status": "processing",
            "owner_id": current_user.id
        }
        
        if not METADATA_DIR.exists():
            METADATA_DIR.mkdir(parents=True, exist_ok=True)

        with open(METADATA_DIR / f"{video_id}.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        def run_indexing():
            asyncio.run(indexing_service.index_video(str(file_path), video_id, owner_id=current_user.id))
        
        if background_tasks:
            background_tasks.add_task(run_indexing)
        
        return {"video_id": video_id, "status": "uploaded_and_indexing_started", "filename": file.filename}
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/videos")
async def list_videos(current_user: User = Depends(get_current_user)):
    """List all videos belonging to the current user"""
    try:
        videos = []
        for meta_file in sorted(Path(METADATA_DIR).glob("*.json"), key=os.path.getmtime, reverse=True):
            try:
                with open(meta_file, 'r') as f:
                    metadata = json.load(f)
                
                if metadata.get("owner_id") == current_user.id:
                    video_id = meta_file.stem
                    video_file_exists = False
                    for ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
                        if (UPLOAD_DIR / f"{video_id}{ext}").exists():
                            video_file_exists = True
                            break
                    
                    if video_file_exists:
                        videos.append({
                            "video_id": video_id,
                            "filename": metadata.get("original_filename"),
                            "status": metadata.get("status", "processing"),
                            "uploaded_at": metadata.get("uploaded_at"),
                        })
            except Exception as e:
                logger.warning(f"Error reading metadata {meta_file}: {e}")
                continue
        
        return {"videos": videos}
    except Exception as e:
        logger.error(f"List videos failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/videos/{video_id}")
async def delete_video(
    video_id: str, 
    current_user: User = Depends(get_current_user),
    vector_store = Depends(deps.get_vector_store)
):
    try:
        metadata_file = METADATA_DIR / f"{video_id}.json"
        if metadata_file.exists():
             with open(metadata_file, 'r') as f:
                metadata = json.load(f)
             if metadata.get("owner_id") != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to delete this video")
        else:
             raise HTTPException(status_code=404, detail="Video not found")

        deleted_files = []
        for video_file in UPLOAD_DIR.glob(f"{video_id}.*"):
            if video_file.is_file() and video_file.suffix in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
                video_file.unlink()
                deleted_files.append(str(video_file))
        
        if metadata_file.exists():
            metadata_file.unlink()
            deleted_files.append(str(metadata_file))
            
        for clip_file in CLIPS_DIR.glob(f"{video_id}_*"):
            if clip_file.is_file():
                clip_file.unlink()
                deleted_files.append(str(clip_file))
        
        try:
            results = vector_store.collection.get(where={"video_id": video_id})
            if results and results.get("ids"):
                vector_store.collection.delete(ids=results["ids"])
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
    vector_store = Depends(deps.get_vector_store)
):
    try:
        metadata_file = METADATA_DIR / f"{video_id}.json"
        if not metadata_file.exists():
             raise HTTPException(status_code=404, detail="Video not found")

        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        if metadata.get("owner_id") != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to retry this video")

        video_file = None
        for vf in UPLOAD_DIR.glob(f"{video_id}.*"):
            if vf.is_file() and vf.suffix in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
                video_file = vf
                break
        
        if not video_file:
            raise HTTPException(status_code=404, detail="Video file not found")
        
        metadata["status"] = "processing"
        metadata.pop("error", None)
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        try:
            results = vector_store.collection.get(where={"video_id": video_id})
            if results and results.get("ids"):
                vector_store.collection.delete(ids=results["ids"])
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
async def sign_video_url(video_id: str, current_user: User = Depends(get_current_user)):
    """Generate a short-lived signed token for video access"""
    try:
        metadata_file = METADATA_DIR / f"{video_id}.json"
        if not metadata_file.exists():
            raise HTTPException(status_code=404, detail="Video not found")
            
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
            
        if metadata.get("owner_id") != current_user.id:
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
