import os
import uuid
import logging
from fastapi import UploadFile
from app.config import UPLOAD_DIR, CLIPS_DIR

logger = logging.getLogger(__name__)

VIDEO_SUFFIXES = {".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"}


async def upload_video(file: UploadFile):
    file_extension = os.path.splitext(file.filename)[1]
    video_id = str(uuid.uuid4())
    file_name = f"{video_id}{file_extension}"
    file_path = UPLOAD_DIR / file_name
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
            
    logger.info(f"Video uploaded: {file_path}")

    return video_id, file_path


def search_video_file(video_id: str):
    for video_file in UPLOAD_DIR.glob(f"{video_id}.*"):
        if video_file.is_file() and video_file.suffix in VIDEO_SUFFIXES:
            return str(video_file)
    return None


def delete_video(video_id: str):
    deleted_files = []
    for video_file in UPLOAD_DIR.glob(f"{video_id}.*"):
        if video_file.is_file() and video_file.suffix in VIDEO_SUFFIXES:
            video_file.unlink()
            deleted_files.append(str(video_file))
    return deleted_files


def delete_clips(video_id: str):
    deleted_files = []
    for clip_file in CLIPS_DIR.glob(f"{video_id}_*"):
        if clip_file.is_file() and clip_file.suffix in VIDEO_SUFFIXES:
            clip_file.unlink()
            deleted_files.append(str(clip_file))
    return deleted_files
