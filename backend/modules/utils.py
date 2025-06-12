from langdetect import detect

def detect_language(text):
    try:
        lang = detect(text)
        return lang  # returns 'fr', 'en', etc.
    except:
        return "en"  # default fallback
