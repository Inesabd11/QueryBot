import re
from typing import Optional

PROMPT_MAP = [
    # (pattern, prompt_file)
    (re.compile(r"\b(camera|ip|rtsp|objectif|résolution|zoom|dôme|ptz|fiche technique)\b", re.I), "prompt_fiche_produit.txt"),
    (re.compile(r"\b(alert|log|erreur|anomalie|timestamp|niveau|event id)\b", re.I), "prompt_logs.txt"),
    (re.compile(r"installation|étape d'installation|procédure|branchez|configurez|guide technique", re.I), "prompt_doc_technique.txt"),
    (re.compile(r"client|probl[èe]me|incident|ticket|support|demande|réclamation", re.I), "prompt_ticket_support.txt"),
    (re.compile(r"^\s*de :|^\s*from:|@.*\..*|objet :|subject:", re.I | re.M), "prompt_email.txt"),
]

DEFAULT_PROMPT = "prompt_general_context.txt"

def select_prompt_from_content(content_chunk: str) -> str:
    """
    Sélectionne dynamiquement le prompt le plus adapté selon le contenu extrait.
    Retourne le nom du fichier prompt à utiliser.
    """
    for pattern, prompt_file in PROMPT_MAP:
        if pattern.search(content_chunk):
            return prompt_file
    return DEFAULT_PROMPT
