import os
import sys
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, StreamingResponse
from pydantic import BaseModel
from datetime import datetime
from typing import List, AsyncGenerator
import json
import asyncio

# Import components with clear names
from routers.chat import router as chat_router
from routers.documents import router as documents_router
from modules.chatbot import Chatbot
from config.paths import UPLOADS_DIR

# Initialize chatbot
chatbot = Chatbot()

# Ensure uploads directory exists
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Update CORS settings for SSE
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://localhost:3000",
    "https://localhost:3001",
    "https://127.0.0.1:3000",
    "https://127.0.0.1:3001"
]

# Add request/response models
class ChatRequest(BaseModel):
    message: str
    chat_history: List[dict] = []

class ChatResponse(BaseModel):
    content: str
    role: str = "assistant"
    timestamp: str
    type: str = "text"

# FastAPI setup
app = FastAPI(
    title="QueryBot API",
    description="RAG-enabled chatbot API with Server-Sent Events support",
    version="1.0.0"
)

# CORS middleware with SSE support
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# SSE Chat endpoint with intelligent routing
@app.post("/api/chat/stream")
async def stream_chat(request: ChatRequest):
    """Stream chat responses using Server-Sent Events with intelligent RAG/General LLM routing"""
    
    async def generate_response() -> AsyncGenerator[str, None]:
        try:
            # Send initial status
            yield f"data: {json.dumps({'type': 'status', 'content': 'processing', 'timestamp': datetime.now().isoformat()})}\n\n"
            
            accumulated_content = ""
            
            # Use the unified response method that handles intelligent routing
            async for chunk in chatbot.unified_response(request.message, request.chat_history, streaming=True):
                accumulated_content += chunk + " "
                yield f"data: {json.dumps({'type': 'stream', 'content': chunk, 'role': 'assistant', 'timestamp': datetime.now().isoformat(), 'accumulated': accumulated_content.strip()})}\n\n"
                await asyncio.sleep(0.01)
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'complete', 'content': accumulated_content.strip(), 'role': 'assistant', 'timestamp': datetime.now().isoformat()})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e), 'timestamp': datetime.now().isoformat()})}\n\n"
        
        # Send end signal
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_response(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        return {
            "status": "ok",
            "timestamp": str(datetime.now()),
            "components": {
                "api": "healthy",
                "chatbot": "initialized",
                "vectorstore": "connected",
                "rag_enabled": hasattr(chatbot, 'vector_store') and chatbot.vector_store is not None
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "message": str(e)
            }
        )

# Root endpoint
@app.get("/")
async def root():
    """Redirect to API documentation"""
    return RedirectResponse(url="/docs")

# Regular chat endpoint (non-streaming) with intelligent routing
@app.post("/api/chat")
async def handle_chat_message(request: ChatRequest):
    try:
        # Use the smart get_response method that handles RAG/General LLM routing
        response = chatbot.get_response(request.message, request.chat_history)
        return ChatResponse(
            content=response,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Include routers
app.include_router(
    chat_router,
    prefix="/api/chat",
    tags=["chat"]
)

app.include_router(
    documents_router,
    prefix="/api/documents",
    tags=["documents"]
)

# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
