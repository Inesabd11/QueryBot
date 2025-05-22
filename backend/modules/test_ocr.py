import os
import logging
from pathlib import Path
import pytesseract
from PIL import Image
from document_loader import ImageLoader

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_tesseract_setup():
    """Test if Tesseract is properly configured"""
    try:
        # Check Tesseract version
        version = pytesseract.get_tesseract_version()
        logger.info(f"✅ Tesseract version: {version}")
        
        # Check Tesseract path
        path = pytesseract.pytesseract.tesseract_cmd
        logger.info(f"✅ Tesseract path: {path}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Tesseract setup error: {str(e)}")
        return False

def create_test_image():
    """Create a simple test image with text"""
    img = Image.new('RGB', (200, 50), color='white')
    test_path = Path(__file__).parent / "test_image.png"
    img.save(test_path)
    logger.info(f"✅ Created test image at: {test_path}")
    return test_path

def test_ocr():
    # Replace with path to a test image
    test_image_path = "tests/test.png"
    
    loader = ImageLoader()
    try:
        docs = loader.load(test_image_path)
        print("OCR Text extracted:")
        print(docs[0].page_content)
        print("\nMetadata:")
        print(docs[0].metadata)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if test_tesseract_setup():
        # Create and test with a sample image
        test_image = create_test_image()
        try:
            img = Image.open(test_image)
            text = pytesseract.image_to_string(img)
            logger.info(f"✅ OCR result: {text.strip() or 'No text detected'}")
        except Exception as e:
            logger.error(f"❌ OCR error: {str(e)}")
        finally:
            # Cleanup
            if test_image.exists():
                test_image.unlink()
    test_ocr()