from langchain.schema import Document
import os

from document_loader import load_document
from vector_store_handler import VectorStoreHandler

def build_index_from_directory(data_dir: str):
    handler = VectorStoreHandler()
    all_docs: list[Document] = []

    for filename in os.listdir(data_dir):
        file_path = os.path.join(data_dir, filename)
        if os.path.isfile(file_path):
            try:
                doc_content = load_document(file_path)
                # Normalize to list of strings
                if isinstance(doc_content, str):
                    doc_content = [doc_content]
                # Wrap in Langchain Document objects
                docs = [Document(page_content=text, metadata={"source": filename}) for text in doc_content]
                all_docs.extend(docs)
                print(f"✅ {filename} chargé.")
            except Exception as e:
                print(f"⚠️ Erreur avec {filename}: {e}")
    
    if all_docs:
        handler.save_vector_store(all_docs)
        print("✅ Index FAISS enregistré avec succès !")
    else:
        print("❌ Aucun document valide à indexer.")
