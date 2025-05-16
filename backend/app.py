import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Project root path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

from routers import chat, documents
from config.paths import UPLOADS_DIR, STORAGE_DIR, VECTOR_STORE_DIR

# Ensure required directories exist
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)
os.makedirs(VECTOR_STORE_DIR, exist_ok=True)

# Create FastAPI app
app = FastAPI(
    title="QueryBot API",
    description="API for QueryBot, a document assistant powered by RAG",
    version="1.0.0",
)

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(documents.router, prefix="/api", tags=["documents"])

@app.get("/")
def read_root():
    return {"message": "Welcome to QueryBot API", "status": "running"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
