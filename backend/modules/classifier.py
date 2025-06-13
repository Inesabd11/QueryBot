import re

# Simple intent keywords for clear conversational patterns
INTENT_KEYWORDS = [
    r"\bbonjour\b", r"\bsalut\b", r"\bhello\b", r"\bhi\b", r"\bbye\b", r"\bau revoir\b",
    r"\bmerci\b", r"\bthank you\b", r"\bthanks\b"
]

def classify(user_input: str) -> str:
    """
    Smart classifier that determines query type:
    - 'intent': Clear conversational patterns (greetings, thanks)
    - 'data_query': Default for most queries (let RAG decide if it has relevant info)
    - 'general_query': Only used as fallback when RAG finds no relevant context
    
    The key insight: Let RAG try first, then fallback to general LLM if no relevant docs found.
    """
    text = user_input.lower().strip()
    
    # Only classify as intent for very clear conversational patterns
    if any(re.search(kw, text) for kw in INTENT_KEYWORDS):
        # But exclude questions that might also be greetings
        if not any(word in text for word in ["?", "what", "how", "why", "when", "where", "qui", "que", "comment", "pourquoi", "quand", "où"]):
            return "intent"
    
    # Default to data_query - let RAG attempt to answer first
    # RAG will fallback to general LLM if no relevant documents found
    return "data_query"

# The classifier is now much simpler and smarter:
# - Only catches clear intents (simple greetings/thanks without questions)
# - Everything else goes to data_query first
# - RAG system will handle the fallback to general LLM internally
