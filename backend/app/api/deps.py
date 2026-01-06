
import logging
from app.db.vector_store import VectorStore
from app.services.indexing import IndexingService
from app.services.search import SearchService
from app.core.config import CHROMA_DB_DIR

logger = logging.getLogger(__name__)

# Singletons
_vector_store = None
_indexing_service = None
_search_service = None

def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore(persist_dir=str(CHROMA_DB_DIR))
    return _vector_store

def get_indexing_service() -> IndexingService:
    global _indexing_service
    if _indexing_service is None:
        vector_store = get_vector_store()
        _indexing_service = IndexingService(vector_store)
    return _indexing_service

def get_search_service() -> SearchService:
    global _search_service
    if _search_service is None:
        vector_store = get_vector_store()
        _search_service = SearchService(vector_store)
    return _search_service
