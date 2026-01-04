import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import endpoints

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

app.include_router(endpoints.router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    logging.info(f"Vantage-Search v{app.version} backend started successfully")



