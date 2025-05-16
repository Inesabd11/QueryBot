# modules/chatbot.py
import os
import sys

from pathlib import Path

from langchain_community.chat_models import ChatOpenAI
from langchain_community.vectorstores import FAISS

from openai import OpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableMap, RunnablePassthrough, RunnableLambda, RunnableSequence
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain.schema import Document
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

from langchain.memory import ConversationBufferMemory

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document
from io import BytesIO
import tempfile

# Configuration from my setup
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
MIXTRAL_MODEL = "mistralai/mixtral-8x7b-instruct-v0.1"
VECTOR_STORE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "vector_store"))
FAISS_INDEX_DIR = os.path.join(VECTOR_STORE_DIR, "faiss_index")

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
RETRIEVER_K = 4
TEMPERATURE = 0.3
MAX_TOKENS = 1024


# Set NVIDIA API Key from environment variable or inline
nvidia_api_key = "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"
os.environ["NVIDIA_API_KEY"] = nvidia_api_key

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config.paths import FAISS_INDEX_DIR, VECTOR_STORE_DIR
from chat_handler import save_message, load_history
from document_loader import load_document, DocumentLoaderFactory

# #Chat history file
# CHAT_HISTORY_FILE = Path("storage/chat_history.json")

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
            
        
        # Setup LangChain LLM using NVIDIA's API and Mixtral
        self.llm = ChatOpenAI(
            model=MIXTRAL_MODEL,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
            openai_api_key=os.environ["NVIDIA_API_KEY"],
            openai_api_base=NVIDIA_BASE_URL,
        )
        
        # Memory to hold the chat history
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    def get_response(self, user_input, file=None):
        """
        Generates a response using the Mixtral model and optionally updates vector store with uploaded file.
        """
        if file:
            self.process_uploaded_file(file)

        # Retrieve documents for context (RAG-style)
        retriever = self.vector_store.as_retriever(search_kwargs={"k": RETRIEVER_K})
        docs = retriever.get_relevant_documents(user_input)
        
        # Format the context from retrieved documents
        if docs:
            context = "\n\n".join([f"Document: {doc.metadata.get('source', 'Unknown')}\nContent: {doc.page_content}" for doc in docs])
        else:
            context = "No relevant documents found."

        # Generate prompt
        prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template="""You are QueryBot, an AI assistant that helps users find information in their documents.
            
Context:
{context}

Question:
{question}

Answer the question based on the context provided. If the answer cannot be found in the context, say so clearly."""
        )
        
        prompt = prompt_template.format(context=context, question=user_input)
        response = self.llm.predict(prompt)

        # Save to memory (LangChain memory)
        self.memory.save_context({"input": user_input}, {"output": response})
        
        
        return response

    def process_uploaded_file(self, file):
        """
        Processes an uploaded file and adds its content to the vector store.
        """
        try:
            # Handle different file types based on file content
            if isinstance(file, BytesIO):
                # This is a file-like object from FastAPI
                file_content = file.read()
                file_name = getattr(file, "filename", "uploaded_file")
                
                # Create a temporary file to process
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_name)[1]) as temp_file:
                    temp_file.write(file_content)
                    temp_path = temp_file.name
                
                # Process the file using your document loader
                try:
                    docs = load_document(temp_path)
                    os.unlink(temp_path)  # Delete the temporary file
                    
                    # Add documents to the vector store
                    self.vector_store.add_documents(docs)
                    self.vector_store.save_local(FAISS_INDEX_DIR)
                    return f"File '{file_name}' successfully processed and added to the vector store."
                except Exception as e:
                    os.unlink(temp_path)  # Ensure temp file is deleted even if processing fails
                    raise e
            else:
                # This is a direct file path or a string
                if hasattr(file, 'name'):
                    # This is likely a file object from Gradio
                    file_content = file.read().decode("utf-8")
                    doc = Document(page_content=file_content, metadata={"source": file.name})
                    self.vector_store.add_documents([doc])
                    self.vector_store.save_local(FAISS_INDEX_DIR)
                    return f"File '{file.name}' successfully processed."
                else:
                    # This is likely a string path
                    docs = load_document(file)
                    self.vector_store.add_documents(docs)
                    self.vector_store.save_local(FAISS_INDEX_DIR)
                    return f"File '{file}' successfully processed."
        except Exception as e:
            raise Exception(f"Error processing file: {str(e)}")
    