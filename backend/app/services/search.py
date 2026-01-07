import os
import logging
import numpy as np
from collections import defaultdict
from typing import List, Dict, Any, Optional

from app.services.vector_store import VectorStore, SearchResults
from app.services.structs import Moment, VideoMetadata
from app.config import (
    CLIPS_DIR, 
    CALIBRATION_FILE, 
    TIME_PADDING_SECONDS, 
    CLUSTER_BUFFER_SECONDS, 
    CONFIDENCE_THRESHOLD,
    STOP_WORDS,
    SIGLIP2_MODEL_ID
)
from vision_tools.core.tools.embedder import OVSigLIP2Embedder
from .utils import cut_video_clip

logger = logging.getLogger(__name__)


class SearchService:

    def __init__(self, vector_store: VectorStore, device: str = "cpu"):
        self.vector_store = vector_store
        self.device = device
        self.embedder = self._load_embedder()

    def _load_embedder(self) -> OVSigLIP2Embedder:
        emebdder = OVSigLIP2Embedder(model_id=SIGLIP2_MODEL_ID,
                                        config={}, device=self.device)
        emebdder.load_tool({})
        logger.info("OVSigLIP2Embedder initialized for search")
        return emebdder

    def search_videos(self, query: str, owner_id: int, limit: int = 5) -> List[Moment]:
        """
        Search for videos utilizing both vector similarity and explicit tag matching.
        """
        vector_results = self._vector_search(query, owner_id, limit)
        tag_results = self._tag_search(query, owner_id, limit)
        
        merged_results = self._merge_and_rank_results(vector_results, tag_results)
        
        moments = self._cluster_moments(merged_results, CLUSTER_BUFFER_SECONDS)
        moments.sort(key=lambda x: x.confidence, reverse=True)
        
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
            return SearchResults(ids=[], metadatas=[], similarities=[])

        return search_results

    def _tag_search(self, query: str, owner_id: int, limit: int) -> SearchResults:

        query_words = [w.lower() for w in query.split()]
        significant_words = [w for w in query_words if w 
                                not in STOP_WORDS and len(w) > 2]
        
        logger.info(f"Tag Search: Query='{query}' -> Keywords={significant_words}")
        
        if not significant_words:
            return SearchResults(ids=[], metadatas=[], similarities=[])
            
        candidate_limit = limit * 10

        try:
            search_results = self.vector_store.search_by_tags(significant_words, 
                                                    owner_id=owner_id, 
                                                    limit=candidate_limit)
        except Exception as e:
            logger.error(f"Tag search failed: {e}")
            return SearchResults(ids=[], metadatas=[], similarities=[])
        
        return search_results

    def _merge_and_rank_results(self, vector_results: SearchResults, 
                                    tag_results: SearchResults) -> Dict[str, Dict]:
     
        merged_results = defaultdict(list)

        confidences = np.array(vector_results.similarities)
        relevant_results_indices = np.where(confidences >= CONFIDENCE_THRESHOLD)[0]

        for idx in relevant_results_indices:
            metadata = vector_results.metadatas[idx]
            video_id = metadata['video_id']
                
            merged_results[video_id].append({
                "timestamp": metadata['timestamp'],
                "confidence": round(confidences[idx] * 100, 2),
                "metadata": metadata,
                "source": "vector"
            })

        # Process Tag Results
        for i, meta in enumerate(tag_results.metadatas):
            video_id = meta['video_id']
            
            merged_results[video_id].append({
                "timestamp": meta['timestamp'],
                "confidence": round(tag_results.similarities[i] * 100, 2),
                "metadata": meta,
                "source": "tag"
            })
                
        return merged_results
                
    def _cluster_moments(self, merged_results: Dict[str, Dict], 
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
        best_match = max(matches, key=lambda x: x['confidence'])
        video_path = best_match['metadata'].get('video_path')
            
        start_time = max(0, min(m['timestamp'] for m in matches) - TIME_PADDING_SECONDS)
        end_time = max(m['timestamp'] for m in matches) + TIME_PADDING_SECONDS
        
        clip_id = f"{video_id}_{int(start_time)}_{int(end_time)}"
        
        clip_path = None
        if video_path and os.path.exists(video_path):
            try:
                clip_path = cut_video_clip(CLIPS_DIR, video_path, start_time, end_time, clip_id)
            except Exception as e:
                logger.error(f"Failed to cut clip: {e}")
        else:
            logger.warning(f"Video path missing or invalid: {video_path}")
        
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
            confidence=best_match['confidence'],
            metadata=VideoMetadata(**metadata),
            match_type=best_match['source'],
            type="clip",
            clip_url=f"/api/clips/{clip_id}" if clip_path else None
        )
