from langchain.schema import Document
import os
import faiss
from document_loader import load_document
from vector_store_handler import VectorStoreHandler

def build_index_from_directory(data_dir: str):
    print(f"📂 Scanning directory: {data_dir}")
    
    # Check if the directory exists
    if not os.path.exists(data_dir):
        print("❌ Directory does not exist.")
        return

    handler = VectorStoreHandler()
    all_docs: list[Document] = []

    # Process each file in the directory
    files = os.listdir(data_dir)
    print(f"🔍 Found files: {files}")
    
    for filename in files:
        file_path = os.path.join(data_dir, filename)

        # Process only files
        if os.path.isfile(file_path):
            print(f"📄 Processing: {filename}")
            try:
                doc_content = load_document(file_path)
                print(f"🧾 Content of {filename}: {doc_content}")

                # Normalize to a list of strings if it's a single string
                if isinstance(doc_content, str):
                    doc_content = [doc_content]

                # Wrap the content in Langchain Document objects
                #docs = [Document(page_content=text, metadata={"source": filename}) for text in doc_content]
                docs = [Document(page_content=text.page_content, metadata={"source": filename}) for text in doc_content]
                all_docs.extend(docs)

            except Exception as e:
                print(f"⚠️ Erreur avec {filename}: {e}")
        else:
            print(f"⛔ Ignored (not a file): {filename}")
    
    # Final Check
    print(f"📄 Total documents to index: {len(all_docs)}")
    
    if all_docs:
        handler.save_vector_store(all_docs)
        print("✅ Index FAISS enregistré avec succès !")
    else:
        print("❌ Aucun document valide à indexer.")

# ----------------------------------------
# Execution if run directly
# ----------------------------------------
if __name__ == "__main__":
    DATA_DIR = os.path.join(os.path.dirname(__file__), "../data/raw")
    DATA_DIR = os.path.abspath(DATA_DIR)
    build_index_from_directory(DATA_DIR)
