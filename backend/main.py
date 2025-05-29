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
    "http://localhost:3001",      # ← ADD THIS LINE
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",      # ← ADD THIS LINE
    "https://localhost:3000",
    "https://localhost:3001",     # ← ADD THIS LINE
    "https://127.0.0.1:3000",
    "https://127.0.0.1:3001"      # ← ADD THIS LINE
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

# SSE Chat endpoint with RAG integration
@app.post("/api/chat/stream")
async def stream_chat(request: ChatRequest):
    """Stream chat responses using Server-Sent Events with RAG retrieval"""
    
    async def generate_response() -> AsyncGenerator[str, None]:
        try:
            # Send initial status
            yield f"data: {json.dumps({'type': 'status', 'content': 'processing', 'timestamp': datetime.now().isoformat()})}\n\n"
            
            # Check if chatbot has native streaming with RAG
            if hasattr(chatbot, 'get_streaming_response_with_rag'):
                # Use native streaming with RAG
                response_stream = chatbot.get_streaming_response_with_rag(request.message)
                
                accumulated_content = ""
                async for chunk in response_stream:
                    accumulated_content += chunk + " "
                    yield f"data: {json.dumps({'type': 'stream', 'content': chunk, 'role': 'assistant', 'timestamp': datetime.now().isoformat(), 'accumulated': accumulated_content.strip()})}\n\n"
                    await asyncio.sleep(0.01)
                    
            elif hasattr(chatbot, 'get_streaming_response'):
                # Use existing streaming but ensure it includes RAG
                response_stream = chatbot.get_streaming_response(request.message)
                
                accumulated_content = ""
                async for chunk in response_stream:
                    accumulated_content += chunk + " "
                    yield f"data: {json.dumps({'type': 'stream', 'content': chunk, 'role': 'assistant', 'timestamp': datetime.now().isoformat(), 'accumulated': accumulated_content.strip()})}\n\n"
                    await asyncio.sleep(0.01)
                    
            else:
                # Fallback: Use regular RAG response and simulate streaming
                yield f"data: {json.dumps({'type': 'status', 'content': 'retrieving_documents', 'timestamp': datetime.now().isoformat()})}\n\n"
                
                # Get full response with RAG (this includes document retrieval)
                full_response = chatbot.get_response(request.message)
                
                # Stream the response word by word to simulate streaming
                words = full_response.split()
                accumulated_content = ""
                
                for i, word in enumerate(words):
                    accumulated_content += word + " "
                    
                    # Send chunk
                    yield f"data: {json.dumps({'type': 'stream', 'content': word, 'role': 'assistant', 'timestamp': datetime.now().isoformat(), 'accumulated': accumulated_content.strip()})}\n\n"
                    
                    # Add small delay for streaming effect
                    await asyncio.sleep(0.05)
                    
                    # Yield control occasionally
                    if i % 10 == 0:
                        await asyncio.sleep(0.001)
            
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
                "rag_enabled": hasattr(chatbot, 'vectorstore') and chatbot.vectorstore is not None
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

# Regular chat endpoint (non-streaming) - This already has RAG
@app.post("/api/chat")
async def handle_chat_message(request: ChatRequest):
    try:
        # This already uses RAG through chatbot.get_response()
        response = chatbot.get_response(request.message)
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