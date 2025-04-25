import os
import sys
import json
from pathlib import Path
#from langchain.chains import ConversationalChain
from langchain_community.chat_models import ChatOpenAI
from langchain_community.vectorstores import FAISS
#from langchain_community.memory import ConversationBufferMemory
from openai import OpenAI
#from langchain.llms import OpenAI
#from langchain.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain.schema import Document
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
#from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document

from chat_handler import save_message, load_history

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

from config.paths import FAISS_INDEX_DIR, VECTOR_STORE_DIR, STORAGE_DIR

# #Chat history file
# CHAT_HISTORY_FILE = Path("storage/chat_history.json")

class Chatbot:
    def __init__(self):
        print("✅ Chatbot initialized")

        # Initialize HuggingFace embeddings
        self.embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

        # Load FAISS vector store
        
        self.vector_store = FAISS.load_local(FAISS_INDEX_DIR, self.embedding_model,allow_dangerous_deserialization=True)
        
        # Setup LangChain LLM using NVIDIA's API and Mixtral
        self.llm = ChatOpenAI(
            model=MIXTRAL_MODEL,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
            openai_api_key=os.environ["NVIDIA_API_KEY"],
            openai_api_base=NVIDIA_BASE_URL,
        )
        #self.chat_history = self.load_chat_history()
        
        print("Trying to load FAISS from:", FAISS_INDEX_DIR)

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
        context = "\n".join([doc.page_content for doc in docs])

        # Generate prompt
        prompt_template = PromptTemplate(
            input_variables = ["context", "question"],
            template = "Context:\n{context}\n\nQuestion:\n{question}\n\nAnswer:"
        )
        prompt = prompt_template.format(context=context, question=user_input)
        response = self.llm.predict(prompt)

        # Save to memory (LangChain memory)
        self.memory.save_context({"input": user_input}, {"output": response})
        
        # Save to persistent history
        save_message("user", user_input)
        save_message("bot", response)

        return response

    def process_uploaded_file(self, file):
        """
        Processes a text file and adds its content to the vector store.
        """
        file_content = file.read().decode("utf-8")
        doc = Document(page_content=file_content, metadata={"source": file.name})
        self.vector_store.add_documents([doc])

