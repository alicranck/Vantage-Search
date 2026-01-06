import os
import subprocess
import logging
import traceback
import json


logger = logging.getLogger(__name__)


def cut_video_clip(clips_dir: str, video_path: str, start_time: float, end_time: float, clip_id: str) -> str:
    """
    Cuts a video clip using ffmpeg. Returns the path to the cut clip.
    """
    output_filename = f"{clip_id}.mp4"
    output_path = os.path.join(clips_dir, output_filename)
    
    if os.path.exists(output_path):
        return output_path
        
    duration = end_time - start_time
    
    # Use -ss before -i for fast seeking
    logger.info(f"FFMPEG Command: ffmpeg -y -ss {start_time} -i {video_path} -t {duration} ...")
    command = [
        "ffmpeg",
        "-y",
        "-ss", str(start_time),
        "-i", video_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-c:a", "aac",
        "-strict", "experimental",
        output_path
    ]
    
    logger.info(f"Cutting clip {clip_id} from {video_path} at {start_time} (duration {duration})")
    subprocess.run(command, check=True, capture_output=True)
    
    return output_path


def _get_calibration_params(calibration_file) -> tuple:
    """Load strict min/max similarity thresholds from calibration results."""
    if not calibration_file.exists():
        raise FileNotFoundError(f"Calibration results not found at {calibration_file}. "
                                    "Please run 'scripts/calibrate_embedder.py' to generate them.")
    try:
        with open(calibration_file, 'r') as f:
            data = json.load(f)

        stats = data.get("stats")
        off_max = stats.get("Off", {}).get("max")
        perfect_mean = stats.get("Perfect", {}).get("mean")
        calibration_params = (off_max * 1.1, perfect_mean)
    except Exception as e:
        logger.error(f"Failed to initialize calibration: {e}")
        logger.error(f"traceback: {traceback.format_exc()}")
        raise

    return calibration_params
