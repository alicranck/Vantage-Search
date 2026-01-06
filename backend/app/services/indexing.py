import logging
import os
import json
import asyncio
import traceback
from pathlib import Path
from datetime import datetime

from app.services.vector_store import VectorStore
from app.config import INDEXING_TIMEOUT, DETECTION_THRESHOLD
from app.db.engine import engine, DBClient
from sqlmodel import Session
from vision_tools.engine.video_engine import VideoInferenceEngine
from vision_tools.core.tools.pipeline import VisionPipeline, PipelineConfig

logger = logging.getLogger(__name__)


class IndexingService:

    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store

    async def index_video(self, video_path: str, video_id: str, owner_id: int):
        """Index a video file by extracting embeddings and detecting objects"""
        if not os.path.exists(video_path):
            logger.error(f"Video not found: {video_path}")
            self._update_metadata(video_id, "failed", error="Video file not found")
            return
            
        logger.info(f"Starting indexing for {video_id} at {video_path}")

        try:
            # Run indexing with timeout
            await asyncio.wait_for(
                self._run_indexing(video_path, video_id, owner_id),
                timeout=INDEXING_TIMEOUT
            )
            
            # Update metadata to completed
            self._update_metadata(video_id, "completed")
            
        except asyncio.TimeoutError:
            logger.error(f"Indexing timed out after {INDEXING_TIMEOUT}s for {video_id}")
            self._update_metadata(video_id, "failed", error=f"Indexing timed out after {INDEXING_TIMEOUT // 60} minutes")
            
        except Exception as e:
            logger.error(f"Indexing failed for {video_id}: {e}")
            logger.error(traceback.format_exc())
            self._update_metadata(video_id, "failed", error=str(e))

    async def _run_indexing(self, video_path: str, video_id: str, owner_id: int):
        """Internal method to run the actual indexing process"""
        pipeline_config = PipelineConfig(
            tool_settings={
                "embedding": {
                    "trigger": {"type": "stride", "value": 30}
                },
                "ov_detection": {
                    "prompt_free": True, 
                    "trigger": {"type": "stride", "value": 30}
                }
            }
        )

        pipeline = VisionPipeline(pipeline_config)
        engine = VideoInferenceEngine(pipeline, video_path)
        
        logger.info(f"Running inference engine for {video_id}...")
        
        async for _ in engine.run_inference(
            on_data=lambda data: self._persist_inference_data(data, video_id, video_path, owner_id), 
            buffer_delay=0, 
            realtime=False
        ):
            pass
        
        # Cleanup
        pipeline.unload_tools()
        logger.info(f"Finished indexing {video_id}")

    async def _persist_inference_data(self, data, video_id: str, video_path: str, owner_id: int):
        """Persist inference results to vector store"""
        tools_run = data.get('tools_run')
        if not tools_run:
            return
        
        timestamp = data['metadata']['timestamp']
        metadata = {
            "video_id": video_id,
            "timestamp": timestamp,
            "video_path": video_path,
            "owner_id": owner_id
        }
        
        # Extract tags if present (detection tool)
        if "boxes" in data:
            valid_boxes = [box for box in data["boxes"] if box["conf"] >= DETECTION_THRESHOLD]            
            class_indices = list(set([box["cls"] for box in valid_boxes]))
            class_names = data.get("class_names", [])
            classes = [class_names[i] for i in class_indices if i < len(class_names)]
            if classes:
                metadata["detected_classes"] = ", ".join(classes)
        
        # Store Embedding with metadata
        if "embedding" in data:
            self.vector_store.add_embedding(data["embedding"], metadata)

    def _update_metadata(self, video_id: str, status: str, error: str = None):
        """Update the metadata for a video in the database"""
        try:
            with Session(engine) as session:
                db = DBClient(session)
                db.update_video_status(video_id, status, error)
                logger.info(f"Updated metadata for {video_id}: status={status}")
            
        except Exception as e:
            logger.error(f"Failed to update metadata for {video_id}: {e}")
