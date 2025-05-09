import os
import sys
import gradio as gr
from pathlib import Path

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config.paths import MODULES_DIR
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), MODULES_DIR)))

from modules.chatbot import Chatbot
from modules.chat_handler import save_message, load_history

chatbot = Chatbot()  # This contains LangChain memory internally

def respond(message, chat_history, memory_state):
    # Save user message
    save_message("user", message)

    # Get response using LangChain memory inside chatbot
    response = chatbot.get_response(message)

    # Save assistant message
    save_message("assistant", response)

    # Append message pair to UI-visible history
    chat_history.append((message, response))

    return "", chat_history, memory_state  # Keep memory_state intact

def create_ui():
    with gr.Blocks() as demo:
        gr.Markdown("## 🤖 Querybot Assistant")

        chatbot_ui = gr.Chatbot(label="Conversation History")
        ui_history = gr.State(load_history_pairs())        # (user, bot) pairs
        memory_state = gr.State(chatbot.memory)            # LangChain memory for LLM

        with gr.Row():
            msg = gr.Textbox(placeholder="Type a message...", scale=8)
            send_btn = gr.Button("Send", scale=1)

        send_btn.click(
            fn=respond,
            inputs=[msg, ui_history, memory_state],
            outputs=[msg, chatbot_ui, memory_state],
            show_progress=True
        )

    return demo

def load_history_pairs():
    """
    Reload conversation as [(user, bot), ...]
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