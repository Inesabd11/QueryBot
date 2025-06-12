import os 
import sys
import asyncio
from pathlib import Path
import logging
from typing import AsyncGenerator, Optional, List, Dict, Any
from datetime import datetime
import json
import tempfile
from io import BytesIO
import csv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add this at the top after basic imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import paths from config
from config.paths import FAISS_INDEX_DIR, VECTOR_STORE_DIR, DATA_DIR

from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import PyPDFLoader, TextLoader, UnstructuredMarkdownLoader
from langchain.document_loaders import UnstructuredWordDocumentLoader, UnstructuredHTMLLoader
from langchain.document_loaders import CSVLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain.schema import Document
from langchain.chat_models import ChatOpenAI

from config.config import (
    EMBEDDING_MODEL,
    MIXTRAL_MODEL,
    TEMPERATURE,
    MAX_TOKENS,
    NVIDIA_BASE_URL,
    RETRIEVER_K
)

# Replace with import from document_loader:
from .document_loader import load_document, load_all_documents_from_directory
from modules.prompt_selector import select_prompt_from_content
from modules.utils import detect_language

LOG_PATH = os.path.join(os.path.dirname(__file__), '../logs/conversation_log.csv')

def log_interaction(user_input, bot_response, strategy):
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, 'a', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([datetime.now().isoformat(), user_input, bot_response, strategy])

class Chatbot:
    def __init__(self):
        print("✅ Chatbot initialized")

        # Initialize HuggingFace embeddings
        self.embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

        # Load FAISS vector store
        try:
            self.vector_store = FAISS.load_local(FAISS_INDEX_DIR, self.embedding_model, allow_dangerous_deserialization=True)
            print(f"✅ FAISS vector store loaded from {FAISS_INDEX_DIR}")
        except Exception as e:
            print(f"⚠️ Could not load FAISS vector store: {e}")
            # Initialize an empty vector store
            self.vector_store = FAISS.from_documents([Document(page_content="Initialized empty vector store.", metadata={"source": "init"})], self.embedding_model)
            os.makedirs(os.path.dirname(FAISS_INDEX_DIR), exist_ok=True)
            self.vector_store.save_local(FAISS_INDEX_DIR)
            print(f"✅ Created new empty FAISS vector store at {FAISS_INDEX_DIR}")
        
        # Load documents from data/raw folder on startup
        self._load_documents_from_data_folder()
            
        # Setup LangChain LLM using NVIDIA's API and Mixtral
        self.llm = ChatOpenAI(
            model=MIXTRAL_MODEL,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
            openai_api_key=os.environ["NVIDIA_API_KEY"],
            openai_api_base=NVIDIA_BASE_URL,
            streaming=True  # Enable streaming
        )
        
        # Memory to hold the chat history
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    # Update the _load_documents_from_data_folder method to use the comprehensive loader:
    def _load_documents_from_data_folder(self):
        """Load all documents from the data/raw folder into the vector store"""
        try:
            raw_data_path = os.path.join(DATA_DIR, "raw")
        
            if not os.path.exists(raw_data_path):
                print(f"⚠️ Data folder not found: {raw_data_path}")
                return
        
            # Use the comprehensive document loader
            all_docs = load_all_documents_from_directory(raw_data_path)
        
            if all_docs:
                self.vector_store.add_documents(all_docs)
                self.vector_store.save_local(FAISS_INDEX_DIR)
                print(f"✅ Total {len(all_docs)} documents loaded from data/raw folder")
            else:
                print("⚠️ No documents found in data/raw folder")
            
        except Exception as e:
            print(f"❌ Error loading documents from data folder: {e}")

    # Also update the process_uploaded_file method to use the existing logic:
    def process_uploaded_file(self, file_path):
        """
        Processes an uploaded file and adds its content to the vector store.
        """
        try:
            # Since we're now receiving a file path string from the router
            if isinstance(file_path, str):
                # Use the comprehensive document loader
                docs = load_document(file_path)
            
                if docs and len(docs) > 0:
                    # Add documents to the vector store
                    self.vector_store.add_documents(docs)
                    self.vector_store.save_local(FAISS_INDEX_DIR)
                
                    file_name = os.path.basename(file_path)
                    print(f"✅ Successfully processed {len(docs)} document chunks from {file_name}")
                    return f"File '{file_name}' successfully processed and added to the knowledge base. {len(docs)} document chunks were created."
                else:
                    raise Exception("No content could be extracted from the file")
                
            else:
                raise Exception("Invalid file path provided")
            
        except Exception as e:
            print(f"❌ Error processing file: {str(e)}")
            raise Exception(f"Error processing file: {str(e)}")

    async def get_streaming_response(self, user_input, chat_history=None) -> AsyncGenerator[str, None]:
        """
        Generates a streaming response using the Mixtral model with RAG.
        """
        try:
            # Retrieve documents for context (RAG-style)
            retriever = self.vector_store.as_retriever(search_kwargs={"k": RETRIEVER_K})
            docs = retriever.get_relevant_documents(user_input)
            
            # Format the context from retrieved documents (show only file name, not path)
            def _short_source(doc):
                src = doc.metadata.get('source', 'Unknown')
                return os.path.basename(src) if src != 'Unknown' else src
            if docs:
                context = "\n\n".join([f"Document: {_short_source(doc)}\nContent: {doc.page_content}" for doc in docs])
                print(f"✅ Retrieved {len(docs)} relevant documents for RAG")
            else:
                context = "No relevant documents found in the knowledge base."
                print("⚠️ No relevant documents found for query")

            # Generate prompt with RAG context
            prompt_template = PromptTemplate(
                input_variables=["context", "question", "chat_history"],
                template="""You are QueryBot, an AI assistant that helps users find information in their documents.

Context from knowledge base:
{context}

Chat History:
{chat_history}

Current Question:
{question}

Instructions:
- Answer the question based primarily on the context provided from the knowledge base
- If the answer cannot be found in the context, clearly state this
- Be concise but comprehensive
- Reference specific documents when relevant
- If chat history is relevant, incorporate it naturally

Answer:"""
            )
            
            # Format chat history
            chat_history_text = ""
            if chat_history:
                for msg in chat_history[-5:]:  # Last 5 messages for context
                    role = msg.get('role', 'unknown')
                    content = msg.get('content', '')
                    chat_history_text += f"{role}: {content}\n"
            
            prompt = prompt_template.format(
                context=context, 
                question=user_input,
                chat_history=chat_history_text
            )
            
            # Get full response first, then simulate streaming
            full_response = self.llm.predict(prompt)
            
            # Simulate streaming by yielding chunks
            words = full_response.split(' ')
            current_chunk = ""
            
            for i, word in enumerate(words):
                current_chunk += word + " "
                
                # Yield chunks of 3-5 words
                if (i + 1) % 4 == 0 or i == len(words) - 1:
                    yield current_chunk.strip()
                    current_chunk = ""
                    await asyncio.sleep(0.1)  # Simulate processing delay
            
            # Save to memory
            self.memory.save_context({"input": user_input}, {"output": full_response})
            
        except Exception as e:
            yield f"Error: {str(e)}"
            print(f"❌ Error in streaming response: {e}")

    def get_response(self, user_input, chat_history=None):
        """
        Génère une réponse avec fallback :
        - Si RAG trouve des documents pertinents, utilise le contexte
        - Sinon, bascule sur le LLM général (réponse type ChatGPT)
        """
        # Détection automatique de la langue de la requête utilisateur
        lang = detect_language(user_input)
        language_instruction = {
            "fr": "Réponds en français.",
            "en": "Reply in English."
        }.get(lang, "Reply in English.")
        
        # Récupération intelligente (hybride si dispo)
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        docs = retriever.get_relevant_documents(user_input)
        # Fallback si pas de contexte pertinent
        if not docs or all(len(doc.page_content.strip()) < 30 for doc in docs):
            # Prompt général sans contexte (mode ChatGPT)
            prompt_template = PromptTemplate(
                input_variables=["question", "chat_history", "language_instruction"],
                template="""{language_instruction}\n\nYou are an expert assistant. Answer the user query naturally and helpfully.\n\nChat History:\n{chat_history}\n\nCurrent Question:\n{question}\n\nAnswer:"""
            )
            chat_history_text = ""
            if chat_history:
                for msg in chat_history[-5:]:
                    role = msg.get('role', 'unknown')
                    content = msg.get('content', '')
                    chat_history_text += f"{role}: {content}\n"
            prompt = prompt_template.format(
                question=user_input,
                chat_history=chat_history_text,
                language_instruction=language_instruction
            )
            response = self.llm.predict(prompt)
            self.memory.save_context({"input": user_input}, {"output": response})
            log_interaction(user_input, response, 'llm_fallback')
            return response
        # Sinon, pipeline RAG classique
        def _short_source(doc):
            src = doc.metadata.get('source', 'Unknown')
            return os.path.basename(src) if src != 'Unknown' else src
        # --- PROMPT SELECTION LOGIC ---
        # Use the most relevant doc chunk to select the prompt
        main_chunk = docs[0].page_content if docs else ""
        prompt_filename = select_prompt_from_content(main_chunk)
        prompt_path = os.path.join(os.path.dirname(__file__), '../prompts', prompt_filename)
        if os.path.exists(prompt_path):
            with open(prompt_path, 'r', encoding='utf-8') as f:
                prompt_template_str = f.read()
        else:
            prompt_template_str = "{language_instruction}\n\nYou are an expert assistant. Based on the provided context below, answer the user query accurately. If the answer is not found, answer naturally using your general knowledge.\n\nContext from knowledge base:\n{context}\n\nChat History:\n{chat_history}\n\nCurrent Question:\n{question}\n\nAnswer:"
        context = "\n\n".join([f"Document: {_short_source(doc)}\nContent: {doc.page_content}" for doc in docs])
        chat_history_text = ""
        if chat_history:
            for msg in chat_history[-5:]:
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')
                chat_history_text += f"{role}: {content}\n"
        prompt = prompt_template_str.format(
            context=context,
            question=user_input,
            chat_history=chat_history_text,
            language_instruction=language_instruction
        )
        response = self.llm.predict(prompt) 
        self.memory.save_context({"input": user_input}, {"output": response})
        log_interaction(user_input, response, f'rag_{prompt_filename}')
        return response

    def get_relevant_sources(self, user_input):
        """Get relevant sources for a query"""
        try:
            retriever = self.vector_store.as_retriever(search_kwargs={"k": RETRIEVER_K})
            docs = retriever.get_relevant_documents(user_input)
            
            sources = []
            for doc in docs:
                sources.append({
                    "title": doc.metadata.get('source', 'Unknown'),
                    "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    "similarity": 0.8  # Placeholder - FAISS doesn't return similarity scores directly
                })
            
            return sources
        except Exception as e:
            print(f"❌ Error getting sources: {e}")
            return []

    # def get_general_response(self, user_input, chat_history=None):
    #     """
    #     Génère une réponse pure LLM (type ChatGPT, sans contexte documentaire).
    #     """
    #     prompt_template = PromptTemplate(
    #         input_variables=["question", "chat_history"],
    #         template="""You are an expert assistant. Answer the user query naturally and helpfully.\n\nChat History:\n{chat_history}\n\nCurrent Question:\n{question}\n\nAnswer:"""
    #     )
    #     chat_history_text = ""
    #     if chat_history:
    #         for msg in chat_history[-5:]:
    #             role = msg.get('role', 'unknown')
    #             content = msg.get('content', '')
    #             chat_history_text += f"{role}: {content}\n"
    #     prompt = prompt_template.format(
    #         question=user_input,
    #         chat_history=chat_history_text
    #     )
    #     response = self.llm.predict(prompt)
    #     self.memory.save_context({"input": user_input}, {"output": response})
    #     log_interaction(user_input, response, 'llm_general')
    #     return response

    # async def get_intelligent_response(self, user_input, chat_history=None, lang="auto"):
    #     """
    #     Route la requête utilisateur vers la bonne pipeline (RAG, intent, général) sans orchestrator.
    #     """
    #     # Utilise le classifier directement
    #     from modules.classifier import classify
    #     strategy = classify(user_input)

    #     if strategy == "data_query":
    #         # Utilise le pipeline RAG (avec historique si besoin)
    #         if hasattr(self, "get_streaming_response"):
    #             # Streaming (async)
    #             async for chunk in self.get_streaming_response(user_input, chat_history):
    #                 log_interaction(user_input, chunk, 'rag_stream')
    #                 yield chunk
    #         else:
    #             # Fallback non-streaming
    #             response = self.get_response(user_input, chat_history)
    #             log_interaction(user_input, response, 'rag')
    #             yield response
    #     elif strategy == "intent":
    #         # Salutation ou action simple
    #         lang = detect_language(user_input)
    #         greeting_fr = "Bonjour! Comment puis-je vous aider aujourd'hui?"
    #         greeting_en = "Hello! How can I help you today?"
    #         translate_fr = "Action de traduction déclenchée."
    #         translate_en = "Translation action triggered."
    #         if any(w in user_input.lower() for w in ["bonjour", "salut", "hello", "hi"]):
    #             yield greeting_fr if lang == "fr" else greeting_en
    #         elif any(w in user_input.lower() for w in ["tradui", "translate"]):
    #             yield translate_fr if lang == "fr" else translate_en
    #         else:
    #             yield greeting_fr if lang == "fr" else greeting_en
    #     else:
    #         # general_query
    #         response = self.get_general_response(user_input, chat_history)
    #         log_interaction(user_input, response, 'llm_general')
    #         yield response
    from .classifier import classify
    async def unified_response(self, user_input, chat_history=None, streaming=False):
        """
        Unified entry point for all chat logic (sync/async, streaming or not).
        """
        from modules.classifier import classify

        lang = detect_language(user_input)
        language_instruction = {
            "fr": "Réponds en français.",
            "en": "Reply in English."
        }.get(lang, "Reply in English.")
        
        strategy = classify(user_input)
        
        async def stream_output(text):
            words = text.split(' ')
            current_chunk = ""
            for i, word in enumerate(words):
                current_chunk += word + " "
                if (i + 1) % 4 == 0 or i == len(words) - 1:
                    yield current_chunk.strip()
                    current_chunk = ""
                    await asyncio.sleep(0.1)
        
        def get_chat_history_text(history):
            if not history:
                return ""
            return "\n".join(f"{msg.get('role', 'unknown')}: {msg.get('content', '')}" for msg in history[-5:])

        # ---- INTENT ----
        if strategy == "intent":
            greetings = {
                "fr": "Bonjour! Comment puis-je vous aider aujourd'hui?",
                "en": "Hello! How can I help you today?"
            }
            translations = {
                "fr": "Action de traduction déclenchée.",
                "en": "Translation action triggered."
            }

            lowered_input = user_input.lower()
            if any(w in lowered_input for w in ["bonjour", "salut", "hello", "hi"]):
                result = greetings.get(lang, greetings["en"])
            elif any(w in lowered_input for w in ["tradui", "translate"]):
                result = translations.get(lang, translations["en"])
            else:
                result = greetings.get(lang, greetings["en"])

            if streaming:
                async for chunk in stream_output(result):
                    yield chunk
            else:
                yield result
            return

        # ---- DATA_QUERY ----
        if strategy == "data_query":
            retriever = self.vector_store.as_retriever(search_kwargs={"k": 5, "score_threshold": 0.6})
            docs = retriever.get_relevant_documents(user_input)
            main_chunk = docs[0].page_content if docs else ""

            prompt_filename = select_prompt_from_content(main_chunk)
            prompt_path = os.path.join(os.path.dirname(__file__), '../prompts', prompt_filename)
            
            if os.path.exists(prompt_path):
                with open(prompt_path, 'r', encoding='utf-8') as f:
                    prompt_template_str = f.read()
            else:
                prompt_template_str = (
                    "{language_instruction}\n\nYou are an expert assistant. "
                    "Based on the provided context below, answer the user query accurately. "
                    "If the answer is not found, answer naturally using your general knowledge.\n\n"
                    "Context from knowledge base:\n{context}\n\n"
                    "Chat History:\n{chat_history}\n\n"
                    "Current Question:\n{question}\n\nAnswer:"
                )
            
            def _short_source(doc):
                src = doc.metadata.get('source', 'Unknown')
                return os.path.basename(src) if src != 'Unknown' else src
            
            context = "\n\n".join(
                f"Document: {_short_source(doc)}\nContent: {doc.page_content}"
                for doc in docs
            )
            chat_history_text = get_chat_history_text(chat_history)

            prompt = prompt_template_str.format(
                context=context,
                question=user_input,
                chat_history=chat_history_text,
                language_instruction=language_instruction
            )

            response = self.llm.predict(prompt)
            self.memory.save_context({"input": user_input}, {"output": response})
            log_interaction(user_input, response, f'rag_{prompt_filename}')

            if streaming:
                async for chunk in stream_output(response):
                    yield chunk
            else:
                yield response
            return

        # ---- GENERAL_QUERY ----
        prompt_template = PromptTemplate(
            input_variables=["question", "chat_history", "language_instruction"],
            template="""{language_instruction}\n\nYou are an expert assistant. Answer the user query naturally and helpfully.\n\nChat History:\n{chat_history}\n\nCurrent Question:\n{question}\n\nAnswer:"""
        )
        chat_history_text = get_chat_history_text(chat_history)
        prompt = prompt_template.format(
            question=user_input,
            chat_history=chat_history_text,
            language_instruction=language_instruction
        )

        response = self.llm.predict(prompt)
        self.memory.save_context({"input": user_input}, {"output": response})
        log_interaction(user_input, response, 'llm_general')

        if streaming:
            async for chunk in stream_output(response):
                yield chunk
        else:
            yield response