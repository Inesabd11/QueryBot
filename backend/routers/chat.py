from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any, AsyncGenerator
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

# SSE streaming endpoint
@router.post("/stream")
async def stream_chat_response(request: ChatRequest):
    """Stream chat responses using Server-Sent Events"""
    
    async def generate_sse_response() -> AsyncGenerator[str, None]:
        try:
            from modules.chatbot import chatbot
            
            # Send processing status
            yield f"data: {json.dumps({'type': 'status', 'content': 'processing', 'timestamp': datetime.now().isoformat()})}\n\n"
            
            # Get streaming response from chatbot
            response_stream = chatbot.get_streaming_response(request.message)
            
            accumulated_content = ""
            async for chunk in response_stream:
                accumulated_content += chunk + " "
                # Send each chunk
                yield f"data: {json.dumps({'type': 'stream', 'content': chunk, 'role': 'assistant', 'timestamp': datetime.now().isoformat(), 'accumulated': accumulated_content.strip()})}\n\n"
                await asyncio.sleep(0.01)  # Small delay to prevent overwhelming
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'complete', 'content': accumulated_content.strip(), 'role': 'assistant', 'timestamp': datetime.now().isoformat()})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e), 'timestamp': datetime.now().isoformat()})}\n\n"
        
        # Send end signal
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_sse_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )

# Regular chat endpoint (non-streaming)
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

# Health check for chat service
@router.get("/health")
async def chat_health():
    return {
        "status": "ok",
        "service": "chat",
        "timestamp": datetime.now().isoformat()
    }