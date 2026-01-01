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
                    "trigger": {"type": "stride", "value": 30}
                },
                "ov_detection": {
                    "model": "yoloe-11s-seg.onnx", # Using general purpose model
                    "vocabulary": ["person", "car", "dog", "cat", "chair"], # Default vocabulary
                    "trigger": {"type": "stride", "value": 30} # Every 1 sec
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
                
                # Extract tags if present (detection tool)
                if "boxes" in data:
                    classes = list(set([box["cls"] for box in data["boxes"]]))
                    if classes:
                        metadata["detected_classes"] = ", ".join(classes)
                
                # Store Embedding with metadata
                if "embedding" in data:
                    self.vector_store.add_embedding(data["embedding"], metadata)
                    logger.debug(f"Indexed frame at {timestamp} with metadata: {metadata}")

            # Run engine
            async for _ in engine.run_inference(on_data=_persist_data, buffer_delay=0, realtime=False):
                pass
            
            pipeline.unload_tools()
            logger.info(f"Finished indexing {video_id}")
            
        except Exception as e:
            logger.error(f"Indexing failed: {e}")
