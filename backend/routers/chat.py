# routers/chat.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any, AsyncGenerator
from pydantic import BaseModel
from datetime import datetime
import json
import asyncio
import logging

# Configure logging
logger = logging.getLogger(__name__)

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

# Import chatbot instance
def get_chatbot():
    """Get chatbot instance with proper error handling"""
    try:
        from modules.chatbot import chatbot
        return chatbot
    except ImportError as e:
        logger.error(f"Failed to import chatbot: {e}")
        return None

# SSE streaming endpoint
@router.post("/stream")
async def stream_chat_response(request: ChatRequest):
    """Stream chat responses using Server-Sent Events"""
    
    async def generate_sse_response() -> AsyncGenerator[str, None]:
        try:
            chatbot = get_chatbot()
            if not chatbot:
                error_data = {
                    'type': 'error', 
                    'content': 'Chatbot service unavailable', 
                    'timestamp': datetime.now().isoformat()
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                yield "data: [DONE]\n\n"
                return
            
            # Send processing status
            status_data = {
                'type': 'status', 
                'content': 'processing', 
                'timestamp': datetime.now().isoformat()
            }
            yield f"data: {json.dumps(status_data)}\n\n"
            
            # Get streaming response from chatbot with chat history
            accumulated_content = ""
            
            async for chunk in chatbot.get_streaming_response(request.message, request.chat_history):
                if chunk.strip():  # Only process non-empty chunks
                    accumulated_content += chunk + " "
                    
                    # Send each chunk
                    stream_data = {
                        'type': 'stream', 
                        'content': chunk, 
                        'role': 'assistant', 
                        'timestamp': datetime.now().isoformat(),
                        'accumulated': accumulated_content.strip()
                    }
                    yield f"data: {json.dumps(stream_data)}\n\n"
                    
                    # Small delay to prevent overwhelming the client
                    await asyncio.sleep(0.02)
            
            # Get relevant sources
            sources = []
            try:
                sources = chatbot.get_relevant_sources(request.message)
            except Exception as e:
                print(f"Error getting sources: {e}")
            
            # Send completion signal with sources
            complete_data = {
                'type': 'complete', 
                'content': accumulated_content.strip(), 
                'role': 'assistant', 
                'timestamp': datetime.now().isoformat(),
                'metadata': {
                    'sources': sources
                }
            }
            yield f"data: {json.dumps(complete_data)}\n\n"
            
        except Exception as e:
            logger.error(f"Error in SSE streaming: {e}")
            error_data = {
                'type': 'error', 
                'content': str(e), 
                'timestamp': datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_data)}\n\n"
        
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
            "Access-Control-Allow-Methods": "*",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Content-Type": "text/event-stream",
        }
    )

# Regular chat endpoint (non-streaming)
@router.post("/message")
async def handle_chat_message(request: ChatRequest):
    """Handle regular chat messages (non-streaming)"""
    try:
        chatbot = get_chatbot()
        if not chatbot:
            raise HTTPException(status_code=503, detail="Chatbot service unavailable")
        
        # Get response from chatbot
        response = chatbot.get_response(request.message, request.chat_history)

        return ChatResponse(
            content=response,
            timestamp=datetime.now().isoformat(),
        )
    except Exception as e:
        logger.error(f"Error in chat message handling: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Health check for chat service
@router.get("/health")
async def chat_health():
    """Check the health of the chat service"""
    try:
        chatbot = get_chatbot()
        if chatbot:
            health_status = chatbot.get_health_status()
            return {
                "status": "ok",
                "service": "chat",
                "timestamp": datetime.now().isoformat(),
                "chatbot": health_status
            }
        else:
            return {
                "status": "degraded",
                "service": "chat",
                "timestamp": datetime.now().isoformat(),
                "error": "Chatbot not available"
            }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "error",
            "service": "chat", 
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

# Get conversation history
@router.get("/history")
async def get_chat_history():
    """Get the current conversation history"""
    try:
        chatbot = get_chatbot()
        if not chatbot:
            raise HTTPException(status_code=503, detail="Chatbot service unavailable")
        
        history = chatbot.get_conversation_history()
        return {
            "status": "ok",
            "history": history,
            "count": len(history),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error retrieving chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Clear conversation history
@router.delete("/history")
async def clear_chat_history():
    """Clear the conversation history"""
    try:
        chatbot = get_chatbot()
        if not chatbot:
            raise HTTPException(status_code=503, detail="Chatbot service unavailable")
        
        chatbot.clear_conversation_history()
        return {
            "status": "ok",
            "message": "Conversation history cleared",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
