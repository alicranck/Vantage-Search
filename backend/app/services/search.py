import os
import json
from pathlib import Path
import logging
import traceback
from collections import defaultdict
from typing import List, Dict, Any, Optional
import numpy as np
from app.db.vector_store import VectorStore
from vision_tools.core.tools.embedder import SigLIP2Embedder
from .utils import cut_video_clip

logger = logging.getLogger(__name__)

# Singleton embedder instance
_embedder_instance: SigLIP2Embedder = None
_calibration_params: Optional[tuple] = None

CLIPS_DIR = "./data/clips"
os.makedirs(CLIPS_DIR, exist_ok=True)

CALIBRATION_FILE = Path(__file__).parent / "calibration_results.json"

TIME_PADDING_SECONDS = 0.5
CLUSTER_BUFFER_SECONDS = 2.0
CONFIDENCE_THRESHOLD = 0.25


def _get_calibration_params() -> tuple:
    """Load strict min/max similarity thresholds from calibration results."""
    global _calibration_params
    if _calibration_params is None:
        if not CALIBRATION_FILE.exists():
            raise FileNotFoundError(
                f"Calibration results not found at {CALIBRATION_FILE}. "
                "Please run 'scripts/calibrate_embedder.py' to generate them.")
        try:
            with open(CALIBRATION_FILE, 'r') as f:
                data = json.load(f)

            stats = data.get("stats")
            off_max = stats.get("Off", {}).get("max")
            perfect_mean = stats.get("Perfect", {}).get("mean")
            _calibration_params = (off_max * 1.1, perfect_mean)
        except Exception as e:
            logger.error(f"Failed to initialize calibration: {e}")
            logger.error(f"traceback: {traceback.format_exc()}")
            raise

    return _calibration_params


def _get_embedder() -> SigLIP2Embedder:
    """Get or create singleton SigLIP2Embedder instance."""
    global _embedder_instance
    if _embedder_instance is None:
        _embedder_instance = SigLIP2Embedder(
            model_id="google/siglip2-base-patch16-384",
            config={},
            device="cpu"
        )
        _embedder_instance.load_tool({})
        logger.info("SigLIP2Embedder initialized for search")
    return _embedder_instance


def search_videos(query: str, vector_store: VectorStore, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search for videos and cluster results into temporal segments (clips).
    """
    embedder = _get_embedder()
    query_vector = embedder.encode_text(query)
    
    candidate_limit = limit * 10
    results = vector_store.search_embeddings(query_vector, n_results=candidate_limit)

    if not results or not results['ids'] or not results['ids'][0]:
        return []

    # Group by video_id
    video_matches = defaultdict(list)
    sim_min, sim_max = _get_calibration_params()

    for i in range(len(results['ids'][0])):
        metadata = results['metadatas'][0][i]        
        raw_distance = results['distances'][0][i]        
        similarity = 1.0 - raw_distance

        if similarity <= sim_min:
            confidence = 0.0
        else:
            confidence = (similarity - sim_min) / (sim_max - sim_min)
            confidence = np.clip(confidence, 0.0, 1.0)
        
        if confidence < CONFIDENCE_THRESHOLD:
            continue

        video_matches[metadata['video_id']].append({
            "timestamp": metadata['timestamp'],
            "distance": raw_distance,
            "confidence": round(confidence * 100.0, 2), # % for UI
            "metadata": metadata
        })

    # group by time proximity
    moments = []
    for video_id, matches in video_matches.items():

        matches.sort(key=lambda x: x['timestamp'])
        
        current_cluster = []
        for match in matches:

            if not current_cluster:
                current_cluster.append(match)
                continue

            last_match = current_cluster[-1]
            if match['timestamp'] - last_match['timestamp'] <= CLUSTER_BUFFER_SECONDS:
                current_cluster.append(match)
            else:
                moments.append(_create_moment(video_id, current_cluster))
                current_cluster = [match]
        
        if current_cluster:
            moments.append(_create_moment(video_id, current_cluster))

    moments.sort(key=lambda x: x['distance'])
    
    return moments[:limit]


def _create_moment(video_id: str, matches: List[Dict]) -> Dict[str, Any]:
    """
    Process a group of frame matches into a single 'moment' result.
    """
    # Best match in this cluster
    best_match = min(matches, key=lambda x: x['distance'])
    video_path = best_match['metadata'].get('video_path')
    
    # Clip range (buffer on each side of the matches)
    start_time = max(0, min(m['timestamp'] for m in matches) - TIME_PADDING_SECONDS)
    end_time = max(m['timestamp'] for m in matches) + TIME_PADDING_SECONDS
    
    clip_id = f"{video_id}_{int(start_time)}_{int(end_time)}"
    
    # Cut the actual video clip
    clip_path = None
    if video_path and os.path.exists(video_path):
        clip_path = cut_video_clip(CLIPS_DIR, video_path, start_time, end_time, clip_id)
    
    # Final metadata for the clip
    metadata = best_match['metadata'].copy()
    metadata.update({
        "start_time": start_time,
        "end_time": end_time,
        "clip_duration": end_time - start_time,
        "match_count": len(matches),
        "clip_id": clip_id,
        "clip_path": clip_path
    })
    
    return {
        "id": clip_id,
        "distance": best_match['distance'],
        "confidence": best_match['confidence'],
        "metadata": metadata,
        "type": "clip",
        "clip_url": f"/api/clips/{clip_id}" if clip_path else None
    }

