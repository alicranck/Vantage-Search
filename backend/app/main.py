import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import videos, search, clips, system, auth
from app.db.engine import create_db_and_tables

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(title="Vantage-Search", version="0.1.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos.router, prefix="/api", tags=["videos"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(clips.router, prefix="/api", tags=["clips"])
app.include_router(system.router, prefix="/api", tags=["system"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])


@app.on_event("startup")
async def startup_event():
    create_db_and_tables()
    logging.info(f"Vantage-Search v{app.version} backend started successfully")



