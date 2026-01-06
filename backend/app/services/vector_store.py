import uuid
import time
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings


logger = logging.getLogger(__name__)


class SearchResults:
    def __init__(self, ids: List[str], metadatas: List[Dict[str, Any]], distances: List[float]):
        self.ids = ids
        self.metadatas = metadatas
        self.distances = distances


class VectorStore:
    """
    Abstraction layer for ChromaDB to store and retrieve video frame embeddings.
    """
    def __init__(self, collection_name: str = "video_frames", persist_dir: str = "chroma_db"):
        self.client = chromadb.PersistentClient(path=persist_dir, settings=Settings(allow_reset=True))
        # Use cosine similarity for embeddings
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
            return SearchResults(ids=[], metadatas=[], distances=[])

        or_clauses = [{"detected_classes": {"$contains": tag}} for tag in tags]
        tag_where_clause = or_clauses[0] if len(or_clauses) == 1 \
                                                else {"$or": or_clauses}
        
        final_where = {"$and": [{"owner_id": owner_id}, tag_where_clause]}
            
        logger.debug(f"Tag search where clause: {final_where}")

        try:
            raw_results = self.collection.get(where=final_where, 
                                                limit=limit, 
                                                include=["metadatas"])
            
            return SearchResults(ids=raw_results['ids'], 
                                 metadatas=raw_results['metadatas'], 
                                 distances=[0.0] * len(raw_results['ids']))
        except Exception as e:
            logger.warning(f"Tag search failed: {e}")
            return SearchResults(ids=[], metadatas=[], distances=[])

    def delete_embeddings(self, where: Dict[str, Any]):
        """
        Deletes embeddings based on metadata filter.
        Example: vector_store.delete_embeddings({"video_id": "123"})
        """
        self.collection.delete(where=where)

    def delete_by_video_id(self, video_id: str):
        self.delete_embeddings({"video_id": video_id})

    def collate(self, raw_results: Dict[str, Any]) -> SearchResults:
        return SearchResults(
            ids=raw_results['ids'][0],
            metadatas=raw_results['metadatas'][0],
            distances=raw_results['distances'][0]
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

