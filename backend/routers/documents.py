import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from config.paths import UPLOADS_DIR
from modules.chatbot import Chatbot

router = APIRouter()
chatbot = Chatbot()  

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Add file type validation
        allowed_types = ['.txt', '.pdf', '.doc', '.docx', '.csv', '.png', '.jpg', '.jpeg', '.xlsx', '.xls']
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"File type not supported. Allowed types: {', '.join(allowed_types)}"
            )

        # Validate file size
        file_size = 0
        file_content = b''
        async for chunk in file.stream():
            file_size += len(chunk)
            if file_size > 10_000_000:  # 10MB limit
                raise HTTPException(status_code=413, detail="File too large")
            file_content += chunk

        file_path = os.path.join(UPLOADS_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        chatbot.process_uploaded_file(file_path)
        return {
            "message": f"File {file.filename} uploaded and processed successfully",
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))