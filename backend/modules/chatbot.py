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
            
            # Format the context from retrieved documents
            if docs:
                context = "\n\n".join([f"Document: {doc.metadata.get('source', 'Unknown')}\nContent: {doc.page_content}" for doc in docs])
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
        Generates a response using the Mixtral model and RAG with chat history support.
        """
        # Retrieve documents for context (RAG-style)
        retriever = self.vector_store.as_retriever(search_kwargs={"k": RETRIEVER_K})
        docs = retriever.get_relevant_documents(user_input)
        
        # Format the context from retrieved documents
        if docs:
            context = "\n\n".join([f"Document: {doc.metadata.get('source', 'Unknown')}\nContent: {doc.page_content}" for doc in docs])
            print(f"✅ Retrieved {len(docs)} relevant documents for RAG")
        else:
            context = "No relevant documents found in the knowledge base."
            print("⚠️ No relevant documents found for query")

        # Format chat history
        chat_history_text = ""
        if chat_history:
            for msg in chat_history[-5:]:  # Last 5 messages for context
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')
                chat_history_text += f"{role}: {content}\n"

        # Generate prompt with RAG context and chat history
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
        
        prompt = prompt_template.format(
            context=context, 
            question=user_input,
            chat_history=chat_history_text
        )
        response = self.llm.predict(prompt)

        # Save to memory (LangChain memory)
        self.memory.save_context({"input": user_input}, {"output": response})
        
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
