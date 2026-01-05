import os
import subprocess
import logging

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
