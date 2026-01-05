
import sys
import os
import argparse
import json
import logging
from pathlib import Path
# import cv2
import numpy as np
from PIL import Image
import torch
from collections import defaultdict
from vision_tools.core.tools.embedder import SigLIP2Embedder, CLIPEmbedder, JinaEmbedder

# Add project root to sys.path
sys.path.append(os.path.abspath(".."))
sys.path.append(os.path.abspath("../vision-tools"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ASSETS_DIR = Path(__file__).parent.parent / "data" / "calibration_assets"
OUTPUT_FILE = Path(__file__).parent.parent / "app" / "services" / "calibration_results.json"


def load_captions(captions_file):
    with open(captions_file, 'r') as f:
        return json.load(f)

def get_embedder(model_name, device):
    if "siglip" in model_name.lower():
        return SigLIP2Embedder(model_id=model_name, device=device)
    elif "jina" in model_name.lower():
        return JinaEmbedder(model_id=model_name, device=device)
    elif "clip" in model_name.lower():
        return CLIPEmbedder(model_id=model_name, config={}, device=device)
    else:
         raise ValueError(f"Unknown embedder type for model: {model_name}")

def calibrate(model_name, device="cpu"):
    logger.info(f"Starting calibration for {model_name} on {device}")
    
    # 1. Load Embedder
    try:
        embedder = get_embedder(model_name, device)
        embedder.load_tool({})
    except Exception as e:
        logger.error(f"Failed to load embedder: {e}")
        return

    # 2. Load Captions
    captions_path = ASSETS_DIR / "captions.json"
    if not captions_path.exists():
        logger.error(f"Captions file not found at {captions_path}")
        return
    
    all_captions = load_captions(captions_path)
    
    results = defaultdict(list)
    
    # 3. Iterate Images
    for filename, captions in all_captions.items():
        image_path = os.path.join(ASSETS_DIR, filename)
        if not os.path.exists(image_path):
            logger.warning(f"Image {filename} not found, skipping.")
            continue
            
        logger.info(f"Processing {filename}...")
        
        # Load and Preprocess Image
        img_pil = Image.open(image_path).convert("RGB")
        
        # It expects numpy array (frame). So I should convert PIL to numpy.
        img_np = np.array(img_pil) 
        
        img_input = embedder.preprocess(img_np)
        img_emb_dict = embedder.inference(img_input)
        img_embedding = np.array(embedder.postprocess(img_emb_dict, None)["embedding"])
        
        # Normalize Image Embedding
        norm_i = np.linalg.norm(img_embedding)
        
        for cap in captions:
            cat = cap["type"]
            text = cap["text"]
            
            # Get Text Embedding
            text_embedding = np.array(embedder.encode_text(text))
            norm_t = np.linalg.norm(text_embedding)
            
            # Compute Cosine Sim
            sim = np.dot(text_embedding, img_embedding) / (norm_t * norm_i)
            results[cat].append(float(sim))


    # 4. Analyze Results
    stats = {}
    logger.info("\nCalibration Results:")
    logger.info("-" * 30)
    for cat, scores in results.items():
        scores = np.array(scores)
        mean = np.mean(scores)
        std = np.std(scores)
        min_v = np.min(scores)
        max_v = np.max(scores)
        
        stats[cat] = {
            "mean": float(mean),
            "std": float(std),
            "min": float(min_v),
            "max": float(max_v),
            "count": len(scores)
        }
        logger.info(f"{cat:10} | Mean: {mean:.4f} | Std: {std:.4f} | Range: [{min_v:.4f}, {max_v:.4f}]")

    # 5. Determine Thresholds (Simple Heuristic for now)
    # Ideally: Threshold > Max Off, Threshold < Min Perfect
    # Let's say we want to filter out 'Off' with high confidence
    
    # Check overlap
    max_off = stats["Off"]["max"]
    min_perfect = stats["Perfect"]["min"]
    min_medium = stats["Medium"]["min"]
    
    logger.info("-" * 30)
    logger.info(f"Gap (Perfect Min - Off Max): {min_perfect - max_off:.4f}")
    
    recommended_threshold = max_off + (min_medium - max_off) / 2
    if recommended_threshold > min_perfect:
         recommended_threshold = min_perfect - 0.05 # Conservative fallback

    # Ensure reasonable bounds
    recommended_threshold = max(0.0, recommended_threshold)
    
    logger.info(f"Recommended Confidence Threshold: {recommended_threshold:.4f}")

    final_output = {
        "model": model_name,
        "device": device,
        "stats": stats,
        "recommended_threshold": recommended_threshold,
        "date": "2026-01-05"
    }

    # 6. Save Results
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(final_output, f, indent=4)
    logger.info(f"Results saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Calibrate Embedder")
    parser.add_argument("--model", type=str, default="google/siglip2-base-patch16-384", help="Model ID")
    parser.add_argument("--device", type=str, default="cpu", help="Device (cpu/cuda)")
    
    args = parser.parse_args()
    calibrate(args.model, args.device)
