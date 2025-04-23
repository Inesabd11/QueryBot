import gradio as gr
from modules.chatbot import Chatbot  # Import the chatbot class that will process user input

# Initialize the chatbot (this will be fleshed out later in chatbot.py)
chatbot = Chatbot()

def chatbot_interface(user_input, file=None):
    """
    This function processes the user input and file upload, then returns the chatbot's response.
    """
    response = chatbot.get_response(user_input, file)  # Call the chatbot to get the response
    return response

# Define the Gradio interface
iface = gr.Interface(
    fn=chatbot_interface,  # The function to handle user input
    inputs=[
        gr.Textbox(label="Enter your message", placeholder="Ask me anything..."),  # Text input for the user
        gr.File(label="Upload File (optional)")  # File upload option for documents
    ],
    outputs="text",  # Output will be in text form
    live=True  # Whether the chatbot responds as the user types
)

# Launch the Gradio interface
iface.launch(debug=True)
