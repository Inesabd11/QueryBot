import os
import sys
from typing import List
from abc import ABC, abstractmethod
import logging
# files format imports
import PyPDF2 
import json
from PIL import Image
import openpyxl
from docx import Document as DocxDocument
import textract
import pandas as pd 
import pytesseract
#langchain
from langchain.schema import Document

# Ajouter le chemin racine pour accéder aux modules config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config.paths import DATA_DIR

#logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --------------------------------------------------------------------
# STEP 1: Abstract Base Class
# --------------------------------------------------------------------

class DocumentLoader(ABC): 
    @abstractmethod
    def load(self, file_path: str) -> List[Document]:
        pass
# --------------------------------------------------------------------
# STEP 2: Different loaders format
# --------------------------------------------------------------------

#PDF 
class PDFLoader(DocumentLoader):
    def load (self, file_path: str) -> List[Document]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f" Le fichier {file_path} n'existe pas.")
        
        text = ""
        with open (file_path, 'rb') as file: 
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages: 
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        logger.info(f"✅ PDF chargé: {file_path}")
        
        return [Document(page_content=text, metadata={"source": file_path})]
    
# PNG, JPG, JPEG    
class ImageLoader(DocumentLoader):
    """
    Unified image loader for PNG, JPG and JPEG formats.
    Uses OCR (pytesseract) to extract text from images.
    """
    # Supported image formats
    SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg']
    
    def load(self, file_path: str) -> List[Document]:
        """
        Load an image file and extract text using OCR.
        
        Args:
            file_path: Path to the image file
            
        Returns:
            List containing a Document with extracted text and metadata
            
        Raises:
            FileNotFoundError: If the file doesn't exist
            ValueError: If the file format is not supported
        """
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Le fichier {file_path} n'existe pas.")
            
        # Check if file format is supported
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Format de fichier non pris en charge: {file_ext}. Formats pris en charge: {', '.join(self.SUPPORTED_FORMATS)}")
        
        # Load image and extract text
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        
        # Log successful loading based on file format
        format_name = file_ext.upper().replace('.', '')
        logger.info(f"✅ {format_name} chargé: {file_path}")
        
        return [Document(page_content=text, metadata={"source": file_path})]
    
#xls & xlsx
class ExcelLoader(DocumentLoader):
    def load(self, file_path: str) -> List[Document]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Le fichier {file_path} n'existe pas.")

        # Get file extension for logging
        _, extension = os.path.splitext(file_path)
        extension = extension.lower()
        file_type = extension[1:].upper()  # Remove the dot and convert to uppercase
        
        # Load the workbook - openpyxl works for both .xlsx and newer .xls files
        try:
            wb = openpyxl.load_workbook(file_path)
            sheet = wb.active
            text = ""

            for row in sheet.iter_rows(values_only=True):
                text += " | ".join([str(cell) for cell in row if cell is not None]) + "\n"
                
        except Exception as e:
            # If openpyxl fails for older .xls files, you might need to use xlrd
            if extension == '.xls':
                import xlrd
                wb = xlrd.open_workbook(file_path)
                sheet = wb.sheet_by_index(0)
                text = ""
                
                for row_idx in range(sheet.nrows):
                    row_values = [str(sheet.cell_value(row_idx, col_idx)) for col_idx in range(sheet.ncols) 
                                 if sheet.cell_value(row_idx, col_idx) is not None]
                    text += " | ".join(row_values) + "\n"
            else:
                # If it's not an .xls file, re-raise the exception
                raise e

        logger.info(f"✅ {file_type} chargé: {file_path}")
        return [Document(page_content=text, metadata={"source": file_path})]

#JSON
class JSONLoader(DocumentLoader):
    def load(self, file_path: str) -> List[Document]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f" Le fichier {file_path} n'existe pas.")

        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        text = json.dumps(data, ensure_ascii=False)

        logger.info(f"✅ JSON chargé: {file_path}")
        return [Document(page_content=text, metadata={"source": file_path})]


#DOCX & DOC
class WordDocumentLoader(DocumentLoader):
    def load(self, file_path: str) -> List[Document]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Le fichier {file_path} n'existe pas.")
        
        # Get file extension
        _, extension = os.path.splitext(file_path)
        extension = extension.lower()
        
        # Process based on file extension
        if extension == '.docx':
            # DOCX handling with python-docx
            doc = DocxDocument(file_path)
            text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            file_type = "DOCX"
        elif extension == '.doc':
            # DOC handling with textract
            text = textract.process(file_path).decode('utf-8')
            file_type = "DOC"
        else:
            raise ValueError(f"Format de fichier non pris en charge: {extension}")
        
        logger.info(f"✅ {file_type} chargé: {file_path}")
        return [Document(page_content=text, metadata={"source": file_path})]

#CSV
class CSVLoader(DocumentLoader):
    def load(self, file_path: str) -> List[Document]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f" Le fichier {file_path} n'existe pas.")

        df = pd.read_csv(file_path)
        rows = df.astype(str).values.tolist()
        documents = []
        
        for row in rows:
            text = " | ".join(row)
            documents.append(Document(page_content=text, metadata={"source": file_path}))
        #row_texts = [" | ".join(row) for row in rows]

        logger.info(f"✅ CSV chargé: {file_path}")
        return documents

#TXT
class TXTLoader(DocumentLoader):
    def load(self, file_path: str) -> List[Document]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f" Le fichier {file_path} n'existe pas.")

        with open(file_path, 'r', encoding='utf-8') as file:
            text = file.read()

        logger.info(f"✅ TXT chargé: {file_path}")
        return [Document(page_content=text, metadata={"source": file_path})]
    
# --------------------------------------------------------------------
# STEP 3: Factory/File Extension
# --------------------------------------------------------------------

class DocumentLoaderFactory:

    @staticmethod
    def get_loader(file_path: str) -> DocumentLoader:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Le fichier {file_path} n'existe pas.")

        extension = os.path.splitext(file_path)[1].lower()

        if extension == '.pdf':
            return PDFLoader()
        elif extension in ['.docx', '.doc']:
            return WordDocumentLoader()
        elif extension == '.csv':
            return CSVLoader()
        elif extension == '.txt':
            return TXTLoader()
        elif extension in ['.png', '.jpg', '.jpeg']:
            return ImageLoader()
        elif extension in ['.xls', '.xlsx']:
            return ExcelLoader()
        elif extension == '.json':
            return JSONLoader()
        else:
            raise ValueError(f"❌ Le format {extension} n'est pas supporté.")

# --------------------------------------------------------------------
# STEP 4: Helper function
# --------------------------------------------------------------------

def load_document(file_path: str) -> List[Document]:
    
    """
    Loads a document from a given file path using the appropriate loader.

    Args:
        file_path (str): The path to the file to be loaded.

    Returns:
        Union[str, List[str]]: The extracted content from the file.
    """
    
    loader = DocumentLoaderFactory.get_loader(file_path)
    return loader.load(file_path)

# --------------------------------------------------------------------
# STEP 5: Load All Files from a Directory
# --------------------------------------------------------------------
def load_all_documents_from_directory(directory: str) -> List[Document]:
    if not os.path.exists(directory):
        raise FileNotFoundError(f"Le dossier {directory} n'existe pas.")

    all_documents = []
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)

        if os.path.isfile(file_path):
            try:
                documents = load_document(file_path)
                all_documents.extend(documents)
            except Exception as e:
                logger.warning(f"⚠️ Erreur lors du chargement de {file_path}: {e}")

    logger.info(f"Total documents chargés: {len(all_documents)}")
    return all_documents

# --------------------------------------------------------------------
# STEP 6: Exemple d’utilisation directe (facultatif)
# --------------------------------------------------------------------

if __name__ == "__main__":
    
    try: 
        directory_path = os.path.join(DATA_DIR, "raw")
        all_docs = load_all_documents_from_directory(directory_path)
        
        for idx, doc in enumerate(all_docs):
            print(f"📄 Document {idx + 1}")
            print(doc.page_content[:300])  # Just previewing the first 300 characters
            print("-" * 80)
            
    except Exception as e:
        logger.error(f"⚠️ Erreur lors du chargement des documents : {e}")


# if __name__ == "__main__":
#     try:
#         content = load_document(os.path.join(DATA_DIR, "TestFile.txt"))
#         for doc in content:
#             print(doc.page_content[:300])
#             print("-" * 50)
#     except Exception as e:
#         logger.error(f"⚠️ Erreur: {e}")