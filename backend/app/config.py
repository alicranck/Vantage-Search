import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

# Storage Paths
UPLOAD_DIR = DATA_DIR / "videos"
CLIPS_DIR = DATA_DIR / "clips"
METADATA_DIR = DATA_DIR / "metadata"
CHROMA_DB_DIR = BASE_DIR / "chroma_db"

# Create directories
for d in [UPLOAD_DIR, CLIPS_DIR, METADATA_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Vector Store
VECTOR_COLLECTION_NAME = "video_frames"

# Indexing
INDEXING_TIMEOUT = 600

# Search
SIGLIP2_MODEL_ID = "google/siglip2-base-patch16-384"
TIME_PADDING_SECONDS = 0.5
CLUSTER_BUFFER_SECONDS = 2.0
CONFIDENCE_THRESHOLD = 0.25
CALIBRATION_FILE = Path(__file__).resolve().parent.parent / "services" / "calibration_results.json"
STOP_WORDS = {"a", "an", "the", "in", "on", "at", 
               "with", "by", "for", "of", "and",
                "is", "are"}

