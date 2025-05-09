import os
import sys
import uvicorn
import shutil
import asyncio
import json
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# Import modules from your existing project
from modules.chatbot import Chatbot
from modules.chat_handler import save_message, load_history, clear_history
from config.paths import UPLOADS_DIR
from routers import chat, documents

# Ensure uploads directory exists
os.makedirs(UPLOADS_DIR, exist_ok=True)

#http://localhost:3000

# FastAPI
app = FastAPI(title="QueryBot API")
# CORS middleware to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow all origins for development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Chatbot
chatbot = Chatbot()

# Client connections for WebSockets
active_connections: Dict[str, WebSocket] = {}

@app.get("/")
def read_root():
    return {"message": "QueryBot API is running"}

@app.get("/api/history")
def get_history():
    """
    Get chat history
    """
    history = load_history()
    return {"history": history}

@app.post("/api/clear-history")
def clear_chat_history():
    """
    Clear chat history
    """
    clear_history()
    return {"message": "Chat history cleared"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Handle file upload
    """
    file_path = os.path.join(UPLOADS_DIR, file.filename)
    
    # Save file to uploads directory
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process the file with your existing document processing logic
    try:
        # Assuming file.file is a binary file object
        file_bytes = await file.read()
        chatbot.process_uploaded_file(file)
        return {"message": f"File {file.filename} uploaded and processed successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/chat")
async def chat(message: dict):
    """
    Send a message to the chatbot and get a response
    """
    try:
        user_message = message.get("message", "")
        response = chatbot.get_response(user_message)
        return {"response": response}
    except Exception as e:
        return {"error": str(e)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time chat
    """
    await websocket.accept()
    connection_id = f"client_{len(active_connections)}"
    active_connections[connection_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            
            # Process message with chatbot
            response = chatbot.get_response(user_message)
            
            # Send response back to client
            await websocket.send_json({
                "role": "assistant",
                "message": response,
                "timestamp": data.get("timestamp", "")
            })
    except WebSocketDisconnect:
        del active_connections[connection_id]
    except Exception as e:
        await websocket.send_json({"error": str(e)})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
