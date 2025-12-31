import logging
import os
from app.db.vector_store import VectorStore
from vision_tools.engine.video_engine import VideoInferenceEngine
from vision_tools.core.tools.pipeline import VisionPipeline, PipelineConfig

logger = logging.getLogger(__name__)

class IndexingService:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store

    async def index_video(self, video_path: str, video_id: str):
        if not os.path.exists(video_path):
            logger.error(f"Video not found: {video_path}")
            return
            
        logger.info(f"Starting indexing for {video_id} using model config...")

        # Configure pipeline for indexing: Embeddings + Detecion (for tags)
        pipeline_config = PipelineConfig(
            tool_settings={
                "embedding": {
                    "model": "ViT-B/32", 
                    "trigger": {"type": "scene_change", "threshold": 0.3}
                },
                "ov_detection": {
                    "model": "yoloe-11s-seg.onnx", # Using general purpose model
                    "vocabulary": ["person", "car", "dog", "cat", "chair"], # Default vocabulary
                    "trigger": {"type": "stride", "value": 30} # Every 30 frames (approx 1 sec)
                }
            }
        )

        try:
            pipeline = VisionPipeline(pipeline_config)
            engine = VideoInferenceEngine(pipeline, video_path)
            
            async def _persist_data(data):
                timestamp = data.get("timestamp", 0.0)
                metadata = {
                    "video_id": video_id,
                    "timestamp": timestamp,
                    "video_path": video_path
                }
                
                # Store Embedding
                if "embedding" in data:
                    self.vector_store.add_embedding(data["embedding"], metadata)
                
                # Store Tags (naively in metadata for now, ideally in a separate relation)
                if "boxes" in data:
                    # Collect unique classes found in this frame
                    classes = list(set([box["cls"] for box in data["boxes"]]))
                    # Note: ChromaDB metadata must be primitive types. Lists might need stringification.
                    # Or we just rely on embeddings for search and this for "smart filtering" later.
                    # For now simplifiy: just embedding search is the core req.
                    pass
                
                if "embedding" in data:
                     logger.debug(f"Indexed frame at {timestamp}")

            # Run engine
            async for _ in engine.run_inference(on_data=_persist_data, buffer_delay=0, realtime=False):
                pass
            
            pipeline.unload_tools()
            logger.info(f"Finished indexing {video_id}")
            
        except Exception as e:
            logger.error(f"Indexing failed: {e}")
