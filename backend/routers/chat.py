from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from datetime import datetime

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from modules.chatbot import Chatbot
from modules.chat_handler import save_message, load_history, clear_history
from config.paths import STORAGE_DIR
# Ensure storage directory exists
os.makedirs(STORAGE_DIR, exist_ok=True)

router = APIRouter()
chatbot = Chatbot()  

class ChatRequest(BaseModel):
    message: str

@router.get("/history")
def get_chat_history():
    """
    Retrieve the chat history.
    """
    history = load_history()
    return {"history": history}

@router.post("/clear_history")
def clear_chat_history():
    """
    Clear the chat history.
    """
    clear_history()
    return {"message": "Chat history cleared."}

@router.post("/chat")
async def chat_with_bot(request: ChatRequest):
    try:
        response = chatbot.get_response(request.message)
        sources = chatbot.get_relevant_sources(request.message)
        
        # Update response format to match frontend expectations
        response_data = {
            "role": "assistant",
            "content": response,
            "timestamp": str(datetime.now()),
            "id": f"msg-{datetime.now().timestamp()}",  # Add ID
            "type": "text",
            "metadata": {
                "sources": sources
            }
        }
        save_message(response_data)
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))