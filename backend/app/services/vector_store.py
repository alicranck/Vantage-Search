import json
import uuid
import logging
from collections import defaultdict
from typing import List, Dict, Any, Optional
import numpy as np
import chromadb
from chromadb.config import Settings
from app.config import CALIBRATION_FILE
from .utils import _get_calibration_params


logger = logging.getLogger(__name__)


class SearchResults:
    def __init__(self, ids: List[str], metadatas: List[Dict[str, Any]],
                         similarities: List[float]):
        self.ids = ids
        self.metadatas = metadatas
        self.similarities = similarities


class VectorStore:
    """
    Abstraction layer for ChromaDB to store and retrieve video frame embeddings.
    """
    def __init__(self, collection_name: str = "video_frames", persist_dir: str = "chroma_db"):
        self.calibration_params = _get_calibration_params(CALIBRATION_FILE)
        self.client = chromadb.PersistentClient(path=persist_dir, settings=Settings(allow_reset=True))
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"VectorStore initialized with collection '{collection_name}' using cosine similarity at '{persist_dir}'")

    def add_embedding(self, embedding: List[float], metadata: Dict[str, Any], id: Optional[str] = None):
        """
        Adds a single embedding to the store.
        """
        if id is None:
            id = str(uuid.uuid4())
        
        self.collection.add(
            embeddings=[embedding],
            metadatas=[metadata],
            ids=[id]
        )

    def search_embeddings(self, query_embedding: List[float], n_results: int = 5,
                                     where: Optional[Dict] = None) -> SearchResults:
        """
        Searches for the nearest neighbors of the query embedding.
        """
        raw_results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where
        )
        return self.collate(raw_results)

    def search_by_tags(self, tags: List[str], owner_id: int,
                         limit: int = 10) -> SearchResults:
        """
        Search for records where 'detected_classes' metadata contains any of the provided tags.
        """
        if not tags:
            return SearchResults(ids=[], metadatas=[], similarities=[])

        search_limit = limit * 10
        
        broad_results = self.collection.get(
            where={"owner_id": owner_id},
            limit=search_limit,
            include=["metadatas"]
        )
        
        filtered_results = self._filter_by_tag(broad_results, tags, limit)
        logger.info(f"Python-side tag search found {len(filtered_results['ids'])} matches" \
                                                    f"(scanned {len(broad_results['ids'])})")
        
        return SearchResults(ids=filtered_results['ids'], 
                                metadatas=filtered_results['metadatas'], 
                                similarities=filtered_results['similarities'])

    def _filter_by_tag(self, candidates: Dict[str, Dict], tags: List[str], limit: int) -> Dict[str, List]:
            
        normalized_tags = [t.lower() for t in tags]

        filtered_results = defaultdict(list)                        
        for i, meta in enumerate(candidates['metadatas']):
        
            classes_str = meta.get('detected_classes', '').lower()
            if not classes_str:
                continue

            class_confidence_mapping = json.loads(meta['class_confidences'])
            matched_tags = [tag for tag in normalized_tags if tag in classes_str]
            if not matched_tags:
                continue

            max_conf = max(class_confidence_mapping.get(tag, 0.0) for tag in matched_tags)
            
            filtered_results['ids'].append(candidates['ids'][i])
            filtered_results['metadatas'].append(meta)
            filtered_results['similarities'].append(max_conf)
                
            if len(filtered_results['ids']) >= limit:
                break

        return filtered_results

    def _get_calibrated_confidences(self, raw_distances: List[float]):

        sim_min, sim_max = self.calibration_params

        np_distances = np.array(raw_distances)

        similarities = 1.0 - np_distances
        confidences = (similarities - sim_min) / (sim_max - sim_min)
        confidences = np.clip(confidences, 0.0, 1.0)

        return confidences.tolist()      

    def delete_embeddings(self, where: Dict[str, Any]):
        """
        Deletes embeddings based on metadata filter.
        Example: vector_store.delete_embeddings({"video_id": "123"})
        """
        self.collection.delete(where=where)

    def delete_by_video_id(self, video_id: str):
        self.delete_embeddings({"video_id": video_id})

    def collate(self, raw_results: Dict[str, Any]) -> SearchResults:
        similarities = self._get_calibrated_confidences(raw_results['distances'][0])
        return SearchResults(
            ids=raw_results['ids'][0],
            metadatas=raw_results['metadatas'][0],
            similarities=similarities
        )
        
    def count(self) -> int:
        return self.collection.count()
    
    def reset(self):
        self.client.reset()

    def clear_collection(self):
        """
        Hard reset: Delete and recreate the collection.
        Useful when reset() fails due to internal corruption.
        """
        try:
            name = self.collection.name
            logger.warning(f"Deleting collection {name}...")
            self.client.delete_collection(name)
        except Exception as e:
            logger.warning(f"Could not delete collection (might not exist): {e}")
            
        logger.info("Recreating collection...")
        self.collection = self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"}
        )

