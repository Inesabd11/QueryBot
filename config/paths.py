import os

# Récupérer le répertoire racine du projet (par exemple : /chemin/vers/QueryBot)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Dossier contenant les documents téléchargés par l'utilisateur
DATA_DIR = os.path.join(BASE_DIR, "data")

# Dossier pour stocker les fichiers d'index FAISS ou Chroma
VECTOR_STORE_DIR = os.path.join(BASE_DIR, "vector_store")
FAISS_INDEX_DIR = os.path.join(VECTOR_STORE_DIR, "faiss_index")

# Dossier pour stocker les fichiers d'embeddings (format .pkl ou autre)
EMBEDDINGS_DIR = os.path.join(VECTOR_STORE_DIR, "embeddings")
DOCS_EMBEDDINGS_PATH = os.path.join(EMBEDDINGS_DIR, "docs_embeddings.pkl")

ENV_PATH = os.path.join(BASE_DIR, ".env")

UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
