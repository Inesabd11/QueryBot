import os
from pathlib import Path

# Model configuration
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
MIXTRAL_MODEL = "mistralai/mixtral-8x7b-instruct-v0.1"
RETRIEVER_K = 4
TEMPERATURE = 0.3
MAX_TOKENS = 1024

# API configuration
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "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")

# Ensure API key is set in environment
if not os.environ.get("NVIDIA_API_KEY"):
    os.environ["NVIDIA_API_KEY"] = NVIDIA_API_KEY
