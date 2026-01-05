import logging
import os
import json
import asyncio
import traceback
from pathlib import Path
from app.db.vector_store import VectorStore
from vision_tools.engine.video_engine import VideoInferenceEngine
from vision_tools.core.tools.pipeline import VisionPipeline, PipelineConfig

logger = logging.getLogger(__name__)

INDEXING_TIMEOUT = 600


class IndexingService:

    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store

    async def index_video(self, video_path: str, video_id: str):
        """Index a video file by extracting embeddings and detecting objects"""
        if not os.path.exists(video_path):
            logger.error(f"Video not found: {video_path}")
            self._update_metadata(video_id, "failed", error="Video file not found")
            return
            
        logger.info(f"Starting indexing for {video_id} at {video_path}")

        try:
            # Run indexing with timeout
            await asyncio.wait_for(
                self._run_indexing(video_path, video_id),
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

    async def _run_indexing(self, video_path: str, video_id: str):
        """Internal method to run the actual indexing process"""
        # Configure pipeline for indexing: Embeddings + Detection (for tags)
        pipeline_config = PipelineConfig(
            tool_settings={
                "embedding": {
                    "trigger": {"type": "stride", "value": 30}
                },
                "ov_detection": {
                    "vocabulary": ["person", "car", "dog", "cat", "chair"],
                    "trigger": {"type": "stride", "value": 30}
                }
            }
        )

        pipeline = VisionPipeline(pipeline_config)
        engine = VideoInferenceEngine(pipeline, video_path)
        
        async def _persist_data(data):
            tools_run = data['tools_run']
            if not tools_run:
                return
            
            timestamp = data['metadata']['timestamp']
            metadata = {
                "video_id": video_id,
                "timestamp": timestamp,
                "video_path": video_path
            }
            
            # Extract tags if present (detection tool)
            if "boxes" in data:
                class_indices = list(set([box["cls"] for box in data["boxes"]]))
                class_names = data.get("class_names", [])
                classes = [class_names[i] for i in class_indices if i < len(class_names)]
                if classes:
                    metadata["detected_classes"] = ", ".join(classes)
            
            # Store Embedding with metadata
            if "embedding" in data:
                self.vector_store.add_embedding(data["embedding"], metadata)

        # Run engine
        logger.info(f"Running inference engine for {video_id}...")
        async for _ in engine.run_inference(
            on_data=_persist_data, 
            buffer_delay=0, 
            realtime=False
        ):
            pass
        
        # Cleanup
        pipeline.unload_tools()
        logger.info(f"Finished indexing {video_id}")

    def _update_metadata(self, video_id: str, status: str, error: str = None):
        """Update the metadata file for a video"""
        try:
            from datetime import datetime
            metadata_dir = Path("./data/videos/metadata")
            metadata_dir.mkdir(parents=True, exist_ok=True)
            metadata_file = metadata_dir / f"{video_id}.json"
            
            metadata = {}
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
            
            metadata.update({
                "status": status,
                "last_updated": datetime.now().isoformat()
            })
            
            if error:
                metadata["error"] = error
            
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
                
            logger.info(f"Updated metadata for {video_id}: status={status}")
            
        except Exception as e:
            logger.error(f"Failed to update metadata for {video_id}: {e}")

