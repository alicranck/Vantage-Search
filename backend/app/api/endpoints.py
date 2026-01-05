import uuid
import os
import logging
import json
import asyncio
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from app.db.vector_store import VectorStore
from app.services.indexing import IndexingService
from app.services.search import search_videos


router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize singletons
vector_store = VectorStore(persist_dir="./data/chroma_db")
indexing_service = IndexingService(vector_store)

UPLOAD_DIR = "./data/videos"
CLIPS_DIR = "./data/clips"

for d in [UPLOAD_DIR, CLIPS_DIR]:
    if not os.path.exists(d):
        os.makedirs(d, exist_ok=True)



@router.post("/upload")
async def upload_video(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    try:
        file_extension = os.path.splitext(file.filename)[1]
        video_id = str(uuid.uuid4())
        file_name = f"{video_id}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
            
        logger.info(f"Video uploaded: {file_path}")
        
        # Save metadata
        from datetime import datetime
        metadata_dir = Path(UPLOAD_DIR) / "metadata"
        metadata_dir.mkdir(exist_ok=True)
        metadata = {
            "original_filename": file.filename,
            "uploaded_at": datetime.now().isoformat(),
            "status": "processing",
        }
        with open(metadata_dir / f"{video_id}.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # Trigger Indexing - use wrapper for async function
        def run_indexing():
            asyncio.run(indexing_service.index_video(file_path, video_id))
        
        background_tasks.add_task(run_indexing)
        
        return {"video_id": video_id, "status": "uploaded_and_indexing_started", "filename": file.filename}
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/search")
async def search(q: str = Query(...), limit: int = 10):
    try:
        results = search_videos(q, vector_store, limit)
        return {"results": results}
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.delete("/reset")
async def reset_db():
    vector_store.reset()
    return {"status": "cleared"}


@router.get("/videos")
async def list_videos():
    """List all uploaded videos with their metadata"""
    try:
        videos = []
        metadata_dir = Path(UPLOAD_DIR) / "metadata"
        metadata_dir.mkdir(exist_ok=True)
        
        for video_file in Path(UPLOAD_DIR).glob("*"):
            if video_file.is_file() and video_file.suffix in ['.mp4', '.avi', '.mov', '.mkv']:
                video_id = video_file.stem
                metadata_file = metadata_dir / f"{video_id}.json"
                
                # Load metadata if exists
                metadata = {}
                if metadata_file.exists():
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                
                # Count embeddings for this video
                try:
                    count = vector_store.collection.count()
                    # This is a simplification - in production you'd filter by video_id
                except:
                    count = 0
                
                videos.append({
                    "video_id": video_id,
                    "filename": metadata.get("original_filename", video_file.name),
                    "status": metadata.get("status", "processing"),
                    "uploaded_at": metadata.get("uploaded_at", "unknown"),
                    "file_size": video_file.stat().st_size,
                })
        
        return {"videos": videos}
    except Exception as e:
        logger.error(f"List videos failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/videos/{video_id}")
async def get_video(video_id: str):
    """Stream a video file"""
    try:
        # Find the video file
        logger.info(f"Getting video {video_id}")
        for video_file in Path(UPLOAD_DIR).glob(f"{video_id}.*"):
            if video_file.is_file():
                return FileResponse(
                    path=str(video_file),
                    media_type="video/mp4",
                    filename=video_file.name
                )
        
        raise HTTPException(status_code=404, detail="Video not found")
    except Exception as e:
        logger.error(f"Get video failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clips/{clip_id}")
async def get_clip(clip_id: str):
    """Serve a cut video clip"""
    try:
        clip_path = os.path.join(CLIPS_DIR, f"{clip_id}.mp4")
        if os.path.exists(clip_path):
            return FileResponse(
                path=clip_path,
                media_type="video/mp4",
                filename=f"{clip_id}.mp4"
            )
        raise HTTPException(status_code=404, detail="Clip not found")
    except Exception as e:
        logger.error(f"Get clip failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/videos/{video_id}")
async def delete_video(video_id: str):
    """Delete a video and all associated data"""
    try:
        deleted_files = []
        
        # Delete video file
        for video_file in Path(UPLOAD_DIR).glob(f"{video_id}.*"):
            if video_file.is_file() and video_file.suffix in ['.mp4', '.avi', '.mov', '.mkv']:
                video_file.unlink()
                deleted_files.append(str(video_file))
                logger.info(f"Deleted video file: {video_file}")
        
        # Delete metadata file
        metadata_file = Path(UPLOAD_DIR) / "metadata" / f"{video_id}.json"
        if metadata_file.exists():
            metadata_file.unlink()
            deleted_files.append(str(metadata_file))
            logger.info(f"Deleted metadata: {metadata_file}")
            
        # Delete associated clips
        for clip_file in Path(CLIPS_DIR).glob(f"{video_id}_*"):
            if clip_file.is_file():
                clip_file.unlink()
                deleted_files.append(str(clip_file))
                logger.info(f"Deleted clip file: {clip_file}")
        
        # Delete embeddings from vector store
        try:
            # Get all IDs that match this video
            results = vector_store.collection.get(
                where={"video_id": video_id}
            )
            if results and results.get("ids"):
                vector_store.collection.delete(ids=results["ids"])
                logger.info(f"Deleted {len(results['ids'])} embeddings for {video_id}")
        except Exception as e:
            logger.warning(f"Failed to delete embeddings for {video_id}: {e}")
        
        if not deleted_files:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {"status": "deleted", "video_id": video_id, "deleted_files": deleted_files}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete video failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/videos/{video_id}/retry")
async def retry_indexing(video_id: str, background_tasks: BackgroundTasks):
    """Retry indexing a failed video"""
    try:
        # Find the video file
        video_file = None
        for vf in Path(UPLOAD_DIR).glob(f"{video_id}.*"):
            if vf.is_file() and vf.suffix in ['.mp4', '.avi', '.mov', '.mkv']:
                video_file = vf
                break
        
        if not video_file:
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Update metadata to processing
        metadata_file = Path(UPLOAD_DIR) / "metadata" / f"{video_id}.json"
        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            metadata["status"] = "processing"
            metadata.pop("error", None)
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
        
        # Clear existing embeddings for this video
        try:
            results = vector_store.collection.get(where={"video_id": video_id})
            if results and results.get("ids"):
                vector_store.collection.delete(ids=results["ids"])
        except Exception as e:
            logger.warning(f"Failed to clear embeddings for {video_id}: {e}")
        
        # Trigger re-indexing
        def run_indexing():
            asyncio.run(indexing_service.index_video(str(video_file), video_id))
        
        background_tasks.add_task(run_indexing)
        
        return {"status": "retry_started", "video_id": video_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Retry indexing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


