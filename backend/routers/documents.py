import os
import shutil
from fastapi import APIRouter, UploadFile, File
from config.paths import UPLOADS_DIR
from modules.chatbot import Chatbot

router = APIRouter()
chatbot = Chatbot()  

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOADS_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        chatbot.process_uploaded_file(file)
        return {"message": f"File {file.filename} uploaded and processed successfully"}
    except Exception as e:
        return {"error": str(e)}