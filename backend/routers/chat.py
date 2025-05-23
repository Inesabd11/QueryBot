from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import json
import asyncio

# Create router with explicit name
router = APIRouter()
# Chat models
class ChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[Dict[str, Any]]] = []

class ChatResponse(BaseModel):
    content: str
    role: str = "assistant"
    timestamp: str
    type: str = "text"

# Enhanced WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.processing: Dict[str, bool] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.processing[client_id] = False

    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
        self.processing.pop(client_id, None)

    async def send_message(self, client_id: str, message_type: str, content: str, **kwargs):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json({
                "type": message_type,
                "content": content,
                "timestamp": datetime.now().isoformat(),
                **kwargs
            })

    async def stream_response(self, client_id: str, response_iterator):
        """Stream response chunks to the client"""
        try:
            async for chunk in response_iterator:
                await self.send_message(
                    client_id,
                    "stream",
                    chunk,
                    role="assistant",
                    is_streaming=True
                )
                await asyncio.sleep(0.05)  # Prevent flooding
            
            # Send completion message
            await self.send_message(
                client_id,
                "complete",
                "",
                role="assistant",
                is_streaming=False
            )
        except Exception as e:
            await self.send_message(client_id, "error", str(e))

manager = ConnectionManager()

# Rename websocket endpoint to be more specific
@router.websocket("/ws/{client_id}")
async def handle_websocket_chat(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_json()
            
            try:
                from modules.chatbot import chatbot
                
                # Send processing status
                await manager.send_message(
                    client_id,
                    "status",
                    "processing",
                    is_processing=True
                )

                # Get streaming response from chatbot
                response_stream = chatbot.get_streaming_response(data["message"])
                await manager.stream_response(client_id, response_stream)

            except Exception as e:
                await manager.send_message(client_id, "error", str(e))

    except WebSocketDisconnect:
        manager.disconnect(client_id)

# Rename chat endpoint to be more specific
@router.post("/message")
async def handle_chat_message(request: ChatRequest):
    try:
        # Get response from chatbot
        from modules.chatbot import chatbot
        response = chatbot.get_response(request.message)

        return ChatResponse(
            content=response,
            timestamp=datetime.now().isoformat(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))