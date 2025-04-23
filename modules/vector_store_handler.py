from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain_community.document_loaders import TextLoader, PyPDFLoader 
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config.paths import DATA_DIR, VECTOR_STORE_DIR

class VectorStoreHandler: 
    def __init__(self, embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """
        Initialise le handler avec le modèle d'embedding.

        Args:
            embedding_model_name (str): Nom du modèle d'embedding.
        """
        self.embedding_model = HuggingFaceEmbeddings(model_name=embedding_model_name)
        self.vector_store_path = os.path.join(VECTOR_STORE_DIR, "faiss_index")

    def save_vector_store(self, documents: list[Document]):
        """
        Enregistre les embeddings des documents dans le store FAISS.

        Args:
            documents (list[Document]): Liste des documents à indexer.
        """
        # Step 1: Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100,
        )
        split_docs = text_splitter.split_documents(documents)

        # Step 2: Convert chunks into embeddings and save
        vectorstore = FAISS.from_documents(split_docs, self.embedding_model)
        vectorstore.save_local(self.vector_store_path)

    def load_vector_store(self) -> FAISS: 
        """
        Charge le store FAISS depuis le disque.

        Returns:
            FAISS: L'objet vectorstore chargé.
        """
        return FAISS.load_local(self.vector_store_path, self.embedding_model)

    def query_vector_store(self, query: str, k: int = 3):
        """
        Exécute une requête sur le store FAISS pour trouver les documents similaires.

        Args:
            query (str): Requête à interroger.
            k (int): Nombre de résultats à retourner.

        Returns:
            list[Document]: Documents les plus similaires à la requête.
        """
        vectorstore = self.load_vector_store()
        return vectorstore.similarity_search(query, k=k)
