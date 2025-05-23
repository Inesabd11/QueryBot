import os
import sys
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
from datetime import datetime
from typing import List
import json

# Import components with clear names
from routers.chat import router as chat_router
from routers.documents import router as documents_router
from modules.chatbot import Chatbot
from config.paths import UPLOADS_DIR

# Initialize chatbot
chatbot = Chatbot()

# Ensure uploads directory exists
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Update CORS settings with WebSocket support
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "ws://localhost:3000",
    "ws://127.0.0.1:3000"
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
    description="RAG-enabled chatbot API with real-time WebSocket support",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

manager = ConnectionManager()

# WebSocket endpoint
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            try:
                # Send processing status
                await websocket.send_json({
                    "type": "status",
                    "content": "processing"
                })

                # Get response from chatbot
                response = chatbot.get_response(data["message"])

                # Send response
                await websocket.send_json({
                    "type": "message",
                    "content": response,
                    "role": "assistant",
                    "timestamp": datetime.now().isoformat()
                })

            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "content": str(e)
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)

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
                "vectorstore": "connected"
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

# Add root endpoint (after FastAPI setup)
@app.get("/")
async def root():
    """Redirect to API documentation"""
    return RedirectResponse(url="/docs")

# Rename chat endpoint to be more specific
@app.post("/api/chat_message")
async def handle_chat_message(request: ChatRequest):
    try:
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

# Include routers with clear names
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

# Root endpoint
# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )