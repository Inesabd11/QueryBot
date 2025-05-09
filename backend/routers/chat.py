from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from modules.chatbot import Chatbot
from modules.chat_handler import save_message, load_history, clear_history

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
def chat_with_bot(request: ChatRequest):
    
    try:
        response = chatbot.get_response(request.message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))