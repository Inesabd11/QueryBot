import re

# Mots-clés pour des intents simples (salutation, traduction, etc.)
INTENT_KEYWORDS = [
    r"\bbonjour\b", r"\bsalut\b", r"\bhello\b", r"\bhi\b", r"\btradui", r"\btranslate"
]
# Mots-clés pour détecter une question sur les données internes (RAG)
DATA_KEYWORDS = [
    r"facture", r"rapport", r"capteur", r"donnée", r"schéma", r"image", r"document", r"pdf", r"tableau"
]

def classify(user_input: str) -> str:
    """
    Classe la requête utilisateur en 'intent', 'data_query', ou 'general_query'.
    Les intents (salutation, traduction) sont prioritaires.
    """
    text = user_input.lower().strip()
    # Priorité : intent > data_query > general_query
    if any(re.search(kw, text) for kw in INTENT_KEYWORDS):
        return "intent"
    if any(re.search(kw, text) for kw in DATA_KEYWORDS):
        return "data_query"
    return "general_query"

# Exemple d'utilisation :
# print(classify("Montre-moi les factures de mars"))  # data_query
# print(classify("Bonjour !"))  # intent
# print(classify("C'est quoi un réseau de neurones ?"))  # general_query
