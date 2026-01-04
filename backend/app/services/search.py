from collections import defaultdict
import clip
import torch
import numpy as np
from typing import List, Dict, Any
from app.db.vector_store import VectorStore


TIME_THRESHOLD_SECONDS = 10.0 


class TextEmbedder:
    _instance = None
    _model = None
    _device = 'cpu'

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self, model_name="ViT-B/32", device="cpu"):
        if TextEmbedder._model is None:
            model, _ = clip.load(model_name, device=device)
            TextEmbedder._model = model
            TextEmbedder._device = device

    def encode_text(self, text: str) -> List[float]:
        text_tokens = clip.tokenize([text]).to(TextEmbedder._device)
        with torch.no_grad():
            text_features = TextEmbedder._model.encode_text(text_tokens)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            return text_features.cpu().numpy()[0].tolist()


def search_videos(query: str, vector_store: VectorStore, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search for videos and cluster results into temporal segments (clips).
    """
    embedder = TextEmbedder.get_instance()
    query_vector = embedder.encode_text(query)
    
    candidate_limit = limit * 10 
    results = vector_store.search_embeddings(query_vector, n_results=candidate_limit)

    if not results or not results['ids'] or not results['ids'][0]:
        return []

    # Group by video_id
    video_matches = defaultdict(list)
    for i in range(len(results['ids'][0])):
        metadata = results['metadatas'][0][i]
        assert 'timestamp' in metadata, f"Missing timestamp in metadata: {metadata}"
        
        video_matches[metadata['video_id']].append({
            "timestamp": metadata['timestamp'],
            "distance": results['distances'][0][i],
            "metadata": metadata
        })

    # group by time proximity
    clusters = []
    for video_id, matches in video_matches.items():
        assert len(np.unique([m['timestamp'] for m in matches])) == len(matches), \
            f"Duplicate timestamps found for video {video_id}, {matches}"
        matches.sort(key=lambda x: x['timestamp'])
        
        current_cluster = []
        for match in matches:
            if not current_cluster:
                current_cluster.append(match)
            else:
                last_match = current_cluster[-1]
                if match['timestamp'] - last_match['timestamp'] <= TIME_THRESHOLD_SECONDS:
                    current_cluster.append(match)
                else:
                    clusters.append(_process_cluster(video_id, current_cluster))
                    current_cluster = [match]
        
        if current_cluster:
            clusters.append(_process_cluster(video_id, current_cluster))

    # 3. Sort clusters by best distance (similarity)
    clusters.sort(key=lambda x: x['distance'])
    
    # 4. Limit to requested number of distinct moments
    return clusters[:limit]


def _process_cluster(video_id: str, matches: List[Dict]) -> Dict[str, Any]:
    """
    Process a group of frame matches into a single 'clip' result.
    """
    # Best match in this cluster
    best_match = min(matches, key=lambda x: x['distance'])
    
    # Clip range (buffer 2s on each side of the matches)
    start_time = max(0, min(m['timestamp'] for m in matches) - 2.0)
    end_time = max(m['timestamp'] for m in matches) + 2.0
    
    # Final metadata for the clip
    metadata = best_match['metadata'].copy()
    metadata.update({
        "start_time": start_time,
        "end_time": end_time,
        "clip_duration": end_time - start_time,
        "match_count": len(matches)
    })
    
    return {
        "id": f"{video_id}_{int(start_time)}",
        "distance": best_match['distance'],
        "metadata": metadata,
        "type": "clip"
    }

