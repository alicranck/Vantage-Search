from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class VideoMetadata(BaseModel):
    video_id: str
    owner_id: Optional[int] = None
    timestamp: float
    video_path: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    clip_duration: Optional[float] = None
    match_count: Optional[int] = None
    clip_id: Optional[str] = None
    clip_path: Optional[str] = None
    detected_classes: Optional[str] = None

class Moment(BaseModel):
    id: str
    confidence: float
    metadata: VideoMetadata
    match_type: str = Field(default="unknown") # 'vector' or 'tag'
    type: str = Field(default="clip")
    clip_url: Optional[str] = None
