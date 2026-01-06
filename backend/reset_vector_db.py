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

def reset_vector_db():
    print(f"Opening VectorStore at {CHROMA_DB_DIR}...")
    try:
        store = VectorStore(persist_dir=str(CHROMA_DB_DIR))
        
        count_before = store.count()
        print(f"Current embedding count: {count_before}")
        
        print("Resetting database...")
        store.reset()
        
        # Re-init to verify (sometimes reset invalidates the client)
        store = VectorStore(persist_dir=str(CHROMA_DB_DIR))
        count_after = store.count()
        print(f"New embedding count: {count_after}")
        
        if count_after == 0:
            print("SUCCESS: Vector database has been cleared.")
        else:
            print("WARNING: Vector database might not be empty.")
            
    except Exception as e:
        print(f"ERROR: Failed to reset vector db: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == '--force':
        reset_vector_db()
    else:
        confirm = input("This will DELETE ALL VECTOR DATA. Are you sure? (y/n): ")
        if confirm.lower() == 'y':
            reset_vector_db()
        else:
            print("Operation cancelled.")
