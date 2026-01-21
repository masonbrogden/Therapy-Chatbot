"""Therapy Chatbot Flask Backend."""
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from db import init_db, db
from src.prompt import system_prompt
import os

# Import route blueprints
from routes.chat import chat_bp
from routes.mood import mood_bp
from routes.plan import plan_bp
from routes.safety import safety_bp
from routes.crisis import crisis_bp
from routes.exercises import exercises_bp
from routes.contact import contact_bp
from routes.data import data_bp
from routes.user import user_bp

# Initialize Flask app
app = Flask(__name__)

# Load environment variables
load_dotenv()

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'sqlite:///instance/therapy_chatbot.db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
init_db(app)

# Enable CORS
CORS(
    app,
    origins=[
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
    ],
    allow_headers=['Content-Type', 'Authorization'],
)

# Legacy RAG chain setup (optional, if Pinecone is available)
rag_chain = None
try:
    RAG_ENABLED = os.environ.get("RAG_ENABLED", "false").lower() in ("1", "true", "yes")
    PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

    if not RAG_ENABLED:
        print("RAG disabled (set RAG_ENABLED=true to enable).")
    elif PINECONE_API_KEY and OPENAI_API_KEY:
        from src.helper import download_hugging_face_embeddings
        from langchain_pinecone import PineconeVectorStore
        from langchain_openai import ChatOpenAI
        from langchain.chains import create_retrieval_chain
        from langchain.chains.combine_documents import create_stuff_documents_chain
        from langchain_core.prompts import ChatPromptTemplate

        os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY
        os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

        try:
            embeddings = download_hugging_face_embeddings()
            index_name = "therapy-chatbot"
            docsearch = PineconeVectorStore.from_existing_index(
                index_name=index_name,
                embedding=embeddings
            )
            retriever = docsearch.as_retriever(search_type="similarity", search_kwargs={"k": 3})
            chatModel = ChatOpenAI(model="gpt-4o")
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("human", "{input}"),
            ])
            question_answer_chain = create_stuff_documents_chain(chatModel, prompt)
            rag_chain = create_retrieval_chain(retriever, question_answer_chain)
            print("RAG chain initialized with Pinecone")
        except Exception as e:
            print(f"RAG chain setup failed: {e}. Chat will use fallback responses.")
    else:
        print("RAG keys missing. Chat will use fallback responses.")
except ImportError:
    print("RAG dependencies not available. Chat will use fallback responses.")


# Register route blueprints
app.register_blueprint(chat_bp)
app.register_blueprint(mood_bp)
app.register_blueprint(plan_bp)
app.register_blueprint(safety_bp)
app.register_blueprint(crisis_bp)
app.register_blueprint(exercises_bp)
app.register_blueprint(contact_bp)
app.register_blueprint(data_bp)
app.register_blueprint(user_bp)


# Health endpoint
@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    try:
        db.session.execute('SELECT 1')
        db_status = 'connected'
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    return jsonify({
        'status': 'ok',
        'db': db_status,
        'rag_available': rag_chain is not None,
    }), 200


# Legacy frontend routes
@app.route('/')
def index():
    """Serve chat.html."""
    return render_template('chat.html')


@app.route('/get', methods=['GET', 'POST'])
def legacy_chat():
    """Legacy chat endpoint (backward compatible)."""
    msg = request.form.get('msg', '')
    
    if not msg:
        return 'No message provided', 400
    
    if rag_chain:
        try:
            response = rag_chain.invoke({"input": msg})
            return str(response.get('answer', 'I understood your message. How can I help?'))
        except Exception as e:
            print(f"RAG error: {e}")
            return f"Thank you for your message. (Backend error: {str(e)})"
    else:
        return "Thank you for sharing. I'm here to listen and support you. Please use the new chat interface."


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9090, debug=True)
