import sys
from pathlib import Path

# Ensure backend root is in sys.path regardless of execution directory
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import cv, jd, score, tailor

app = FastAPI(
    title="Jomble Backend API",
    description="Stateless LLM compute microservice for resume parsing, tailoring, and scoring.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(cv.router, prefix="/cv", tags=["cv"])
app.include_router(jd.router, prefix="/jd", tags=["jd"])
app.include_router(score.router, prefix="/score", tags=["score"])
app.include_router(tailor.router, prefix="/tailor", tags=["tailor"])




@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "FastAPI backend connection successful!",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)