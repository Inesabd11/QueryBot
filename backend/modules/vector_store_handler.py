from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain_community.document_loaders import TextLoader, PyPDFLoader 
import os
import sys
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import re

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

    def hybrid_search(self, query: str, k: int = 5, dense_k: int = 10, keyword_k: int = 10):
        """
        Perform a hybrid search: combine dense (vector) and keyword (TF-IDF) search, re-rank, and filter results.
        Args:
            query (str): The user query.
            k (int): Number of final results to return.
            dense_k (int): Number of dense results to retrieve.
            keyword_k (int): Number of keyword results to retrieve.
        Returns:
            list[Document]: Most relevant and diverse documents.
        """
        vectorstore = self.load_vector_store()
        # Dense retrieval
        dense_results = vectorstore.similarity_search(query, k=dense_k)
        # Keyword retrieval (TF-IDF)
        all_docs = vectorstore.docstore._dict.values()
        texts = [doc.page_content for doc in all_docs]
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(texts)
        query_vec = tfidf.transform([query])
        scores = np.dot(tfidf_matrix, query_vec.T).toarray().flatten()
        keyword_indices = np.argsort(scores)[::-1][:keyword_k]
        keyword_results = [list(all_docs)[i] for i in keyword_indices if scores[i] > 0]
        # Merge and deduplicate
        all_results = dense_results + keyword_results
        unique_results = self._deduplicate_docs(all_results)
        # Filter low-information chunks
        filtered_results = [doc for doc in unique_results if self._is_informative(doc.page_content)]
        # Re-rank for diversity (simple: prefer different sources/sections)
        reranked = self._rerank_for_diversity(filtered_results, k)
        return reranked[:k]

    def _deduplicate_docs(self, docs):
        seen = set()
        unique = []
        for doc in docs:
            key = (doc.metadata.get('source', ''), doc.metadata.get('section', ''), self._normalize_text(doc.page_content))
            if key not in seen:
                seen.add(key)
                unique.append(doc)
        return unique

    def _normalize_text(self, text):
        return re.sub(r'\W+', '', text.lower())[:100]

    def _is_informative(self, text, min_length=50):
        # Filter out very short or boilerplate chunks
        return text and len(text.strip()) >= min_length and not text.strip().lower().startswith('page')

    def _rerank_for_diversity(self, docs, k):
        # Prefer docs from different sources/sections
        selected = []
        seen_sources = set()
        for doc in docs:
            src = (doc.metadata.get('source', ''), doc.metadata.get('section', ''))
            if src not in seen_sources:
                selected.append(doc)
                seen_sources.add(src)
            if len(selected) >= k:
                break
        # If not enough, fill up
        if len(selected) < k:
            for doc in docs:
                if doc not in selected:
                    selected.append(doc)
                if len(selected) >= k:
                    break
        return selected

# (Tout est déjà bien structuré pour un RAG moderne !)
# Pour aller plus loin :
# - Pour un reranker type CrossEncoder, ajouter ici après hybrid_search (optionnel)
# - Pour un nettoyage avancé, ajouter une méthode de cleaning dans le split ou avant l'indexation
# - Pour logs/évaluation, ajouter un log des requêtes et des résultats ici
