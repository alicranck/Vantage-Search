import uuid
import os
import logging
from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException, Query
from fastapi.responses import JSONResponse
from app.db.vector_store import VectorStore
from app.services.indexing import IndexingService
from app.services.search import search_videos

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize singletons
vector_store = VectorStore(persist_dir="./data/chroma_db")
indexing_service = IndexingService(vector_store)

UPLOAD_DIR = "./data/videos"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

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
        
        # Trigger Indexing
        background_tasks.add_task(indexing_service.index_video, file_path, video_id)
        
        return {"video_id": video_id, "status": "uploaded_and_indexing_started"}
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
