import os
import json
import logging
import traceback
import numpy as np
from collections import defaultdict
from typing import List, Dict, Any, Optional

from app.db.vector_store import VectorStore, SearchResults
from app.domain.models import Moment, VideoMetadata
from app.core.config import (
    CLIPS_DIR, 
    CALIBRATION_FILE, 
    TIME_PADDING_SECONDS, 
    CLUSTER_BUFFER_SECONDS, 
    CONFIDENCE_THRESHOLD,
    STOP_WORDS,
    SIGLIP2_MODEL_ID
)
from vision_tools.core.tools.embedder import SigLIP2Embedder
from .utils import cut_video_clip, _get_calibration_params

logger = logging.getLogger(__name__)


class SearchService:

    def __init__(self, vector_store: VectorStore, device: str = "cpu"):
        self.vector_store = vector_store
        self.device = device
        self.calibration_params = _get_calibration_params(CALIBRATION_FILE)
        self.embedder = self._load_embedder()

    def _load_embedder() -> SigLIP2Embedder:
        emebdder = SigLIP2Embedder(model_id=SIGLIP2_MODEL_ID,
                                        config={}, device=self.device)
        emebdder.load_tool({})
        logger.info("SigLIP2Embedder initialized for search")
        return emebdder

    def search_videos(self, query: str, owner_id: int,
                        limit: int = 5) -> List[Moment]:
        """
        Search for videos utilizing both vector similarity and explicit tag matching.
        """
        vector_results = self._vector_search(query, owner_id, limit)
        tag_results = self._tag_search(query, owner_id, limit)
        
        merged_results = self._merge_and_rank_results(vector_results, tag_results)
        
        moments = self._cluster_moments(merged_results, CLUSTER_BUFFER_SECONDS)
        moments.sort(key=lambda x: x.distance)
        
        return moments[:limit]

    def _vector_search(self, query: str, owner_id: int, limit: int) -> SearchResults:
        
        query_vector = self.embedder.encode_text(query)
        where_filter = {"owner_id": owner_id}
        candidate_limit = limit * 10        
        
        try:
            search_results = self.vector_store.search_embeddings(query_vector, 
                                                                 n_results=candidate_limit,
                                                                 where=where_filter)
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")
            return SearchResults(ids=[], metadatas=[], distances=[])

        return search_results

    def _tag_search(self, query: str, owner_id: int, limit: int) -> SearchResults:

        query_words = [w.lower() for w in query.split()]
        significant_words = [w for w in query_words if w 
                                not in STOP_WORDS and len(w) > 2]    
        candidate_limit = limit * 10
        
        res = self.vector_store.search_by_tags(significant_words, 
                                                owner_id=owner_id, 
                                                limit=candidate_limit)

        return res

    def _merge_and_rank_results(self, vector_results: SearchResults, 
                                tag_results: SearchResults) -> Dict[str, Dict]:
     
        merged_results = {} # id -> {confidence, val...}

        confidences = self._get_calibrated_confidences(vector_results.distances)
        relevant_results_indices = np.where(confidences >= CONFIDENCE_THRESHOLD)[0]
        for idx in relevant_results_indices:
            vid = vector_results.ids[idx]            
            merged_results[vid] = {
                "timestamp": vector_results.metadatas[idx]['timestamp'],
                "distance": vector_results.distances[idx],
                "confidence": round(confidences[idx] * 100, 2),
                "metadata": vector_results.metadatas[idx],
                "source": "vector"
            }

        # Process Tag Results
        for i, vid in enumerate(tag_results.ids):
            merged_results[vid] = {
                "timestamp": tag_results.metadatas[i]['timestamp'],
                "distance": 0.0,
                "confidence": 100,
                "metadata": tag_results.metadatas[i],
                "source": "tag"
            }
                
        return merged_results

    @staticmethod
    def _cluster_moments(merged_results: Dict[str, Dict], 
                            buffer_seconds: float) -> List[Moment]:

        moments = []
        for video_id, matches in merged_results.items():
        
            matches.sort(key=lambda x: x['timestamp'])
            
            current_cluster = matches[:1]
            for match in matches[1:]:
                last_match = current_cluster[-1]
                if match['timestamp'] - last_match['timestamp'] <= buffer_seconds:
                    current_cluster.append(match)
                else:
                    moments.append(self._create_moment(video_id, current_cluster))
                    current_cluster = [match]
            
            if current_cluster:
                moments.append(self._create_moment(video_id, current_cluster))
                
        return moments

    @staticmethod
    def _create_moment(video_id: str, matches: List[Dict]) -> Moment:
        """Process a group of frame matches into a single 'moment' result."""
        best_match = min(matches, key=lambda x: x['distance'])
        video_path = best_match['metadata'].get('video_path')
        
        start_time = max(0, min(m['timestamp'] for m in matches) - TIME_PADDING_SECONDS)
        end_time = max(m['timestamp'] for m in matches) + TIME_PADDING_SECONDS
        
        clip_id = f"{video_id}_{int(start_time)}_{int(end_time)}"
        
        clip_path = None
        if video_path and os.path.exists(video_path):
            clip_path = cut_video_clip(CLIPS_DIR, video_path, start_time, end_time, clip_id)
        
        metadata = best_match['metadata'].copy()
        metadata.update({
            "start_time": start_time,
            "end_time": end_time,
            "clip_duration": end_time - start_time,
            "match_count": len(matches),
            "clip_id": clip_id,
            "clip_path": clip_path
        })
        
        return Moment(
            id=clip_id,
            distance=best_match.distance,
            confidence=best_match.confidence,
            metadata=VideoMetadata(**metadata_dict),
            match_type=best_match.source,
            type="clip",
            clip_url=f"/api/clips/{clip_id}" if clip_path else None
        )

    def _get_calibrated_confidences(self, raw_distances: List[float]):

        sim_min, sim_max = self.calibration_params

        np_distances = np.array(raw_distances)

        similarities = 1.0 - np_distances
        confidences = (similarities - sim_min) / (sim_max - sim_min)
        confidences = np.clip(confidences, 0.0, 1.0)

        return confidences.tolist()
