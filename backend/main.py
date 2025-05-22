import os
import sys
import uvicorn

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# Import routers
from routers import chat, documents
from config.paths import UPLOADS_DIR


# Ensure uploads directory exists
os.makedirs(UPLOADS_DIR, exist_ok=True)

# FastAPI setup
app = FastAPI(
    title="QueryBot API",
    description="RAG-enabled chatbot API with real-time WebSocket support",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(
    chat.router,
    prefix="/api",
    tags=["chat"]
)

app.include_router(
    documents.router,
    prefix="/api",
    tags=["documents"]
)

# Health check endpoint
@app.get("/")
def read_root():
    """API root endpoint"""
    return {
        "status": "healthy",
        "message": "QueryBot API is running",
        "version": "1.0.0"
    }

# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )