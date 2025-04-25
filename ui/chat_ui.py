import os
import sys
import gradio as gr
from pathlib import Path

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config.paths import MODULES_DIR
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), MODULES_DIR)))

from modules.chatbot import Chatbot
from modules.chat_handler import save_message, load_history

chatbot = Chatbot()

def respond(message, chat_history):
    save_message("user", message)
    response = chatbot.get_response(message)
    save_message("assistant", response)
    
    chat_history.append((message, response))
    return "", chat_history

def create_ui():
    with gr.Blocks() as demo:
        gr.Markdown("## 🤖 Querybot Assistant")
        
        chatbot = gr.Chatbot(label="Conversation History")
        state = gr.State(load_history_pairs())
        
        with gr.Row():
            msg = gr.Textbox(placeholder="Type a message...", scale=8)
            send_btn = gr.Button("Send", scale=1)
        
        send_btn.click(
            fn=respond,
            inputs=[msg, state],
            outputs=[msg, chatbot],
            show_progress=True
        )
    return demo

def load_history_pairs():
    """
     reload conversation [(user, bot), ...]
    """
    history = load_history()
    pairs = []
    current_user_msg = None
    
    for entry in history:
        if entry["role"] == "user":
            current_user_msg = entry["message"]
        elif entry["role"] == "assistant" and current_user_msg:
            pairs.append((current_user_msg, entry["message"]))
            current_user_msg = None
    return pairs