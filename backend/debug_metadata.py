import sys
from pathlib import Path
import logging

# Add backend directory to python path
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

from app.services.vector_store import VectorStore
from app.config import CHROMA_DB_DIR

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def dump_metadata():
    print(f"Opening VectorStore at {CHROMA_DB_DIR}...")
    try:
        store = VectorStore(persist_dir=str(CHROMA_DB_DIR))
        
        count = store.count()
        print(f"Total embeddings: {count}")
        
        if count == 0:
            print("Database is empty.")
            return

        # Fetch first 5 items to check metadata structure
        print("Fetching sample entries...")
        results = store.collection.get(limit=5, include=['metadatas'])
        
        for i, meta in enumerate(results['metadatas']):
            print(f"--- Entry {i} ---")
            print(meta)
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    dump_metadata()
