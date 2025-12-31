
try:
    from app.main import app
    print("Backend initialized successfully")
    from vision_tools.engine.video_engine import VideoInferenceEngine
    print("Vision tools imported successfully")
except Exception as e:
    print(f"Startup failed: {e}")
