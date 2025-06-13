import os 
import sys
import asyncio
from pathlib import Path
import logging
from typing import AsyncGenerator
from datetime import datetime  
import csv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import paths from config
from config.paths import FAISS_INDEX_DIR, VECTOR_STORE_DIR, DATA_DIR

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores.faiss import FAISS
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain.schema import Document
from langchain_openai import ChatOpenAI

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
from modules.prompt_selector import select_prompt_from_content, select_prompt_from_query
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

    def _check_document_relevance(self, user_input, docs, threshold=0.3):
        """
        More sophisticated document relevance checking: checks for keyword overlap and date/entity matches.
        """
        if not docs:
            return False
        query_words = set(user_input.lower().split())
        import re
        date_pattern = r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4}\b'
        dates = re.findall(date_pattern, user_input.lower())
        # Debug: print out the docs being checked
        print(f"[DEBUG] Checking relevance for query: '{user_input}'")
        print(f"[DEBUG] Top {min(3, len(docs))} docs:")
        for idx, doc in enumerate(docs[:3]):
            print(f"  Doc {idx+1} source: {doc.metadata.get('source', 'Unknown')}")
            content_preview = doc.page_content[:120].replace('\n', ' ')
            print(f"  Content preview: {content_preview}...")

        # Lower threshold for short or keyword queries
        if len(query_words) <= 3 or any(word in user_input.lower() for word in ["maintenance", "maintain", "upkeep", "service", "repair"]):
            threshold = 0.1
            print(f"[DEBUG] Lowering relevance threshold to {threshold} for short/keyword query.")

        # ...existing code...
        for doc in docs[:3]:  # Check top 3 documents
            doc_text = doc.page_content.lower()
            # Date/entity match
            date_match = False
            if dates:
                for date in dates:
                    if date in doc_text:
                        date_match = True
                        break
            else:
                date_match = True  # No dates in query, so no constraint
            # Keyword overlap
            doc_words = set(doc_text.split())
            overlap = len(query_words.intersection(doc_words))
            overlap_ratio = overlap / len(query_words) if query_words else 0
            print(f"[DEBUG] Doc overlap: {overlap}, ratio: {overlap_ratio:.2f}, date_match: {date_match}, content_len: {len(doc.page_content.strip())}")
            if overlap_ratio > threshold and date_match and len(doc.page_content.strip()) > 20:
                print(f"[DEBUG] Doc {doc.metadata.get('source', 'Unknown')} deemed relevant.")
                return True
        print("[DEBUG] No relevant document found for this query.")
        return False

    def _get_robust_prompt(self, user_input, docs, lang="fr"):
        """
        Get a robust prompt that works even if specific prompt files don't exist
        """
        # Try to select prompt from query first (more reliable)
        prompt_filename = select_prompt_from_query(user_input)
        
        # If that doesn't work, try from content
        if prompt_filename == "prompt_general_context.txt" and docs:
            main_chunk = docs[0].page_content if docs else ""
            prompt_filename = select_prompt_from_content(main_chunk)
        
        # Try to load the selected prompt file
        prompt_path = os.path.join(os.path.dirname(__file__), '../prompts', prompt_filename)
        
        if os.path.exists(prompt_path):
            try:
                with open(prompt_path, 'r', encoding='utf-8') as f:
                    prompt_template_str = f.read()
                print(f"✅ Loaded prompt file: {prompt_filename}")
                return prompt_template_str, prompt_filename
            except Exception as e:
                print(f"⚠️ Error reading prompt file {prompt_filename}: {e}")
        
        # Fallback to a robust default prompt
        print(f"⚠️ Using fallback prompt (file not found: {prompt_filename})")
        
        if lang == "fr":
            fallback_prompt = """Tu es un assistant expert qui analyse des documents et répond aux questions des utilisateurs.

INSTRUCTIONS:
- Réponds TOUJOURS en français
- Base ta réponse sur le contexte fourni ci-dessous
- Si l'information n'est pas dans le contexte, dis-le clairement
- Sois précis et concis
- Pour les questions de comptage (combien, nombre), donne un chiffre exact si possible

Contexte de la base de connaissances:
{context}

Historique de conversation:
{chat_history}

Question actuelle:
{question}

Réponse:"""
        else:
            fallback_prompt = """{language_instruction}

You are an expert assistant that analyzes documents and answers user questions.

INSTRUCTIONS:
- Base your answer on the context provided below
- If information is not in the context, state this clearly
- Be precise and concise
- For counting questions (how many, number), provide exact figures if possible

Context from knowledge base:
{context}

Chat History:
{chat_history}

Current Question:
{question}

Answer:"""
        
        return fallback_prompt, "fallback_prompt"

    async def get_streaming_response(self, user_input, chat_history=None) -> AsyncGenerator[str, None]:
        """
        Generates a streaming response using the Mixtral model with intelligent RAG/General LLM routing.
        """
        try:
            # Always try RAG first for non-intent queries
            retriever = self.vector_store.as_retriever(search_kwargs={"k": RETRIEVER_K})
            docs = retriever.get_relevant_documents(user_input)
            
            # Check if documents are actually relevant
            has_relevant_docs = self._check_document_relevance(user_input, docs)
            
            if has_relevant_docs:
                # Use RAG approach
                print(f"✅ Using RAG: Retrieved {len(docs)} relevant documents")
                
                def _short_source(doc):
                    src = doc.metadata.get('source', 'Unknown')
                    return os.path.basename(src) if src != 'Unknown' else src
                
                context = "\n\n".join([f"Document: {_short_source(doc)}\nContent: {doc.page_content}" for doc in docs])
                
                prompt_template = PromptTemplate(
                    input_variables=["context", "question", "chat_history"],
                    template="""You are QueryBot, an AI assistant that helps users find information.

Context from knowledge base:
{context}

Chat History:
{chat_history}

Current Question:
{question}

Instructions:
- Answer the question based primarily on the context provided from the knowledge base 
- Be concise but comprehensive
- Reference specific documents when relevant
- If chat history is relevant, incorporate it naturally

Answer:"""
                )
            else:
                # Use general LLM approach
                print("⚠️ Using General LLM: No relevant documents found")
                
                prompt_template = PromptTemplate(
                    input_variables=["question", "chat_history"],
                    template="""You are an expert AI assistant. Answer the user's question naturally and helpfully using your general knowledge.

Chat History:
{chat_history}

Current Question:
{question}

Answer:"""
                )
                context = ""
            
            # Format chat history
            chat_history_text = ""
            if chat_history:
                for msg in chat_history[-5:]:  # Last 5 messages for context
                    role = msg.get('role', 'unknown')
                    content = msg.get('content', '')
                    chat_history_text += f"{role}: {content}\n"
            
            # Generate prompt based on approach
            if has_relevant_docs:
                prompt = prompt_template.format(
                    context=context, 
                    question=user_input,
                    chat_history=chat_history_text
                )
            else:
                prompt = prompt_template.format(
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
        Smart response generation with automatic RAG/General LLM routing
        """
        # Detect language
        lang = detect_language(user_input)
        language_instruction = {
            "fr": "Réponds toujours en français.",
            "en": "Reply in English."
        }.get(lang, "Reply in English.")
        
        # Always try RAG first
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        docs = retriever.get_relevant_documents(user_input)
        
        # Check if documents are actually relevant
        has_relevant_docs = self._check_document_relevance(user_input, docs)
        
        if has_relevant_docs:
            # Use RAG approach
            print(f"✅ Using RAG: Found relevant documents")
            
            def _short_source(doc):
                src = doc.metadata.get('source', 'Unknown')
                return os.path.basename(src) if src != 'Unknown' else src
            
            # Use improved prompt selection
            prompt_template_str, prompt_filename = self._get_robust_prompt(user_input, docs, lang)
            
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
        
        else:
            # Use general LLM approach
            print("⚠️ Using General LLM: No relevant documents found")
            
            prompt_template = PromptTemplate(
                input_variables=["question", "chat_history", "language_instruction"],
                template="""{language_instruction}\n\nYou are an expert assistant. Answer the user query naturally and helpfully using your general knowledge.\n\nChat History:\n{chat_history}\n\nCurrent Question:\n{question}\n\nAnswer:"""
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
            log_interaction(user_input, response, 'llm_general')
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
        
    def _prioritize_event_docs(self, user_input, docs):
        """
        For event/date/count queries, prioritize docs with more overlaps and those containing event fields.
        This does NOT hardcode filenames, but uses content structure and overlap.
        """
        user_input_lower = user_input.lower()
        event_fields = ["date", "type_evenement", "camera_id", "niveau_confiance", "site"]
        # Score: number of overlaps + number of event fields present
        def score(doc):
            doc_content = doc.page_content.lower()
            overlap = len(set(user_input_lower.split()) & set(doc_content.split()))
            event_field_count = sum(f in doc_content for f in event_fields)
            return overlap + event_field_count
        # Sort descending by score
        return sorted(docs, key=score, reverse=True) 
    async def unified_response(self, user_input, chat_history=None, streaming=False):
        """
        Unified entry point for all chat logic with smart routing.
        """
        from modules.classifier import classify

        # At the beginning of unified_response method, replace the language detection section with:
        lang = detect_language(user_input)
        print(f"🌐 Detected language: {lang}")

        language_instruction = {
            "fr": "Réponds toujours en français, même si le contexte est en anglais.",
            "en": "Reply in English.",
            "es": "Responde en español.",
            "de": "Antworte auf Deutsch."
        }.get(lang, "Reply in English.")
        
        strategy = classify(user_input)
        print(f"🔍 Query classified as: {strategy}")
        
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

        # ---- INTENT (Simple greetings/thanks) ----
        if strategy == "intent":
            greetings = {
                "fr": "Bonjour! Comment puis-je vous aider aujourd'hui?",
                "en": "Hello! How can I help you today?"
            }
            thanks = {
                "fr": "De rien! N'hésitez pas si vous avez d'autres questions.",
                "en": "You're welcome! Feel free to ask if you have more questions."
            }

            lowered_input = user_input.lower()
            if any(w in lowered_input for w in ["bonjour", "salut", "hello", "hi"]):
                result = greetings.get(lang, greetings["en"])
            elif any(w in lowered_input for w in ["merci", "thank", "thanks"]):
                result = thanks.get(lang, thanks["en"])
            else:
                result = greetings.get(lang, greetings["en"])

            log_interaction(user_input, result, 'intent')
            
            if streaming:
                async for chunk in stream_output(result):
                    yield chunk
            else:
                yield result
            return

        # ---- DATA_QUERY (Try RAG first, fallback to general LLM) ----
        if strategy == "data_query":
            # 1. Expand query (optional, can add later)
            # expanded_query = self.expand_query(user_input)
            # 2. Use hybrid search
            docs = self.hybrid_search(user_input, k=8)
            # 4. (Optional) Metadata filtering can be added here
            # 5. Check document relevance
            has_relevant_docs = self._check_document_relevance(user_input, docs)
            if has_relevant_docs:
                prioritized_docs = self._prioritize_event_docs(user_input, docs)
                def _short_source(doc):
                    src = doc.metadata.get('source', 'Unknown')
                    return os.path.basename(src) if src != 'Unknown' else src
                main_chunk = prioritized_docs[0].page_content if prioritized_docs else ""
                prompt_filename = select_prompt_from_content(main_chunk)
                prompt_path = os.path.join(os.path.dirname(__file__), '../prompts', prompt_filename)
                if os.path.exists(prompt_path):
                    with open(prompt_path, 'r', encoding='utf-8') as f:
                        prompt_template_str = f.read()
                else:
                    prompt_template_str = (
                        "{language_instruction}\n\nYou are an expert assistant. "
                        "Based on the provided context below, answer the user query accurately.\n\n"
                        "Context from knowledge base:\n{context}\n\n"
                        "Chat History:\n{chat_history}\n\n"
                        "Current Question:\n{question}\n\nAnswer:"
                    )
                context = "\n\n".join(
                    f"Document: {_short_source(doc)}\nContent: {doc.page_content}"
                    for doc in prioritized_docs
                )
                chat_history_text = get_chat_history_text(chat_history)
                prompt = prompt_template_str.format(
                    context=context,
                    question=user_input,
                    chat_history=chat_history_text,
                    language_instruction=language_instruction
                )
                response = self.llm.invoke(prompt).content
                self.memory.save_context({"input": user_input}, {"output": response})
                log_interaction(user_input, response, f'rag_{prompt_filename}')
                if streaming:
                    async for chunk in stream_output(response):
                        yield chunk
                else:
                    yield response
                return
            else:
                prompt_template = PromptTemplate(
                    input_variables=["question", "chat_history", "language_instruction"],
                    template="""{language_instruction}\n\nYou are an expert assistant. Answer the user query naturally and helpfully using your general knowledge.\n\nChat History:\n{chat_history}\n\nCurrent Question:\n{question}\n\nAnswer:"""
                )
                chat_history_text = get_chat_history_text(chat_history)
                prompt = prompt_template.format(
                    question=user_input,
                    chat_history=chat_history_text,
                    language_instruction=language_instruction
                )
                response = self.llm.invoke(prompt).content
                self.memory.save_context({"input": user_input}, {"output": response})
                log_interaction(user_input, response, 'llm_general_fallback')
                if streaming:
                    async for chunk in stream_output(response):
                        yield chunk
                else:
                    yield response
                return

    def hybrid_search(self, user_input, k=5):
        """
        Combine dense vector search (FAISS) with keyword search (BM25) for better results.
        """
        # Dense results from FAISS
        dense_results = self.vector_store.similarity_search(user_input, k=k)

        # BM25 keyword search
        try:
            from rank_bm25 import BM25Okapi
        except ImportError:
            print("⚠️ rank_bm25 not installed, using only dense retrieval.")
            return dense_results

        # Get all documents from the vector store
        all_docs = list(self.vector_store.docstore._dict.values())
        corpus = [doc.page_content for doc in all_docs]
        tokenized_corpus = [doc.split() for doc in corpus]
        bm25 = BM25Okapi(tokenized_corpus)
        tokenized_query = user_input.split()
        bm25_scores = bm25.get_scores(tokenized_query)
        bm25_top_indices = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)[:k]
        bm25_results = [all_docs[i] for i in bm25_top_indices]

        # Combine results, removing duplicates
        combined_results = []
        seen_ids = set()
        for doc in dense_results + bm25_results:
            doc_id = doc.metadata.get('source', '') + doc.page_content[:50]
            if doc_id not in seen_ids:
                combined_results.append(doc)
                seen_ids.add(doc_id)
        return combined_results[:k]
