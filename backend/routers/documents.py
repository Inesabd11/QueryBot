import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from config.paths import UPLOADS_DIR
from config.constants import ALL_SUPPORTED_EXTENSIONS, MAX_FILE_SIZE, validate_file
from modules.chatbot import Chatbot
from pathlib import Path

router = APIRouter()
chatbot = Chatbot()  

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Use shared file validation
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALL_SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported. Allowed types: {', '.join(sorted(ALL_SUPPORTED_EXTENSIONS))}"
            )

        # Read and validate file content
        file_content = b''
        file_size = 0
        async for chunk in file.stream():
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum size: {MAX_FILE_SIZE/1024/1024}MB"
                )
            file_content += chunk

        # Save and process file
        file_path = Path(UPLOADS_DIR) / file.filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)

        try:
            validate_file(file_path)
            chatbot.process_uploaded_file(str(file_path))
            return {
                "message": f"File {file.filename} uploaded and processed successfully",
                "success": True
            }
        except Exception as e:
            # Clean up on error
            file_path.unlink(missing_ok=True)
            raise HTTPException(status_code=500, detail=str(e))
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))