import re
from typing import Optional

PROMPT_MAP = [
    # (pattern, prompt_file)
    (re.compile(r"\b(camera|ip|rtsp|objectif|résolution|zoom|dôme|ptz|fiche technique)\b", re.I), "prompt_fiche_produit.txt"),
    (re.compile(r"\b(alert|log|erreur|anomalie|timestamp|niveau|event id)\b", re.I), "prompt_logs.txt"),
    (re.compile(r"installation|étape d'installation|procédure|branchez|configurez|guide technique", re.I), "prompt_doc_technique.txt"),
    (re.compile(r"client|probl[èe]me|incident|ticket|support|demande|réclamation", re.I), "prompt_ticket_support.txt"),
    (re.compile(r"^\s*de :|^\s*from:|@.*\..*|objet :|subject:", re.I | re.M), "prompt_email.txt"),
    # Add French/IA event detection and counting patterns
    (re.compile(r"\b(événement|evenement|détection|detection|intrusion|mouvement|objet abandonné|caméra|camera|site|niveau de confiance|rapport|analyse|ia|intelligence artificielle)\b", re.I), "prompt_rapport_detection.txt"),
    (re.compile(r"\bcombien\b", re.I), "prompt_rapport_detection.txt"),
    (re.compile(r"\b(enregistré|enregistres|enregistrés|enregistrees|date|quand|nombre|total)\b", re.I), "prompt_rapport_detection.txt"),
    (re.compile(r"\b(\d{4}-\d{2}-\d{2}|\d{1,2} [a-zéû]+ \d{4})\b", re.I), "prompt_rapport_detection.txt"),  # date patterns
]

DEFAULT_PROMPT = "prompt_general_context.txt"

def select_prompt_from_content(content_chunk: str) -> str:
    """
    Sélectionne dynamiquement le prompt le plus adapté selon le contenu extrait.
    Retourne le nom du fichier prompt à utiliser.
    """
    # If content is empty or not document-related, always use the general prompt
    if not content_chunk or not content_chunk.strip():
        return DEFAULT_PROMPT
    for pattern, prompt_file in PROMPT_MAP:
        if pattern.search(content_chunk):
            return prompt_file
    return DEFAULT_PROMPT

def select_prompt_from_query(user_query: str) -> str:
    """
    Sélectionne dynamiquement le prompt le plus adapté selon la requête utilisateur.
    Cette fonction analyse directement la requête plutôt que le contenu des documents.
    Retourne le nom du fichier prompt à utiliser.
    """
    if not user_query or not user_query.strip():
        return DEFAULT_PROMPT
    
    query_lower = user_query.lower()
    
    # Check each pattern against the user query
    for pattern, prompt_file in PROMPT_MAP:
        if pattern.search(query_lower):
            return prompt_file
    
    return DEFAULT_PROMPT
