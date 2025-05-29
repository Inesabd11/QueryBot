import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from config.paths import UPLOADS_DIR
from config.constants import ALL_SUPPORTED_EXTENSIONS, MAX_FILE_SIZE, validate_file
from pathlib import Path 
import tempfile

router = APIRouter()

# Import the chatbot instance
def get_chatbot():
    """Get chatbot instance with proper error handling"""
    try:
        from modules.chatbot import Chatbot
        # Create a global chatbot instance if it doesn't exist
        if not hasattr(get_chatbot, '_chatbot_instance'):
            get_chatbot._chatbot_instance = Chatbot()
        return get_chatbot._chatbot_instance
    except ImportError as e:
        print(f"Failed to import chatbot: {e}")
        return None

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALL_SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported. Allowed types: {', '.join(sorted(ALL_SUPPORTED_EXTENSIONS))}"
            )

        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE/1024/1024}MB"
            )

        # Save file temporarily for processing
        file_path = Path(UPLOADS_DIR) / file.filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)

        try:
            # Validate the saved file
            validate_file(file_path)
            
            # Get chatbot instance and process the file
            chatbot = get_chatbot()
            if not chatbot:
                raise HTTPException(status_code=503, detail="Chatbot service unavailable")
            
            # Process the uploaded file with the RAG system
            result_message = chatbot.process_uploaded_file(str(file_path))
            
            return JSONResponse(
                status_code=200,
                content={
                    "message": result_message,
                    "filename": file.filename,
                    "size": file_size,
                    "success": True
                }
            )
            
        except Exception as e:
            # Clean up on error
            if file_path.exists():
                file_path.unlink(missing_ok=True)
            raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/status")
async def get_upload_status():
    """Get the status of the document processing system"""
    try:
        chatbot = get_chatbot()
        if chatbot:
            return {
                "status": "ok",
                "service": "document_upload",
                "uploads_dir": str(UPLOADS_DIR),
                "supported_formats": list(ALL_SUPPORTED_EXTENSIONS)
            }
        else:
            return {
                "status": "error",
                "service": "document_upload",
                "error": "Chatbot service unavailable"
            }
    except Exception as e:
        return {
            "status": "error",
            "service": "document_upload",
            "error": str(e)
        }
