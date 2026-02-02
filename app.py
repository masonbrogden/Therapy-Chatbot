"""Therapy Chatbot Flask Backend."""
from flask import Flask, render_template, jsonify, request
from sqlalchemy import text
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
from routes.journal import journal_bp
from routes.chat_profile import chat_profile_bp

# Initialize Flask app
app = Flask(__name__)

# Load environment variables from root-level .env
load_dotenv()

# LLM initialization state
chat_model = None
rag_chain = None
if not os.getenv("OPENAI_API_KEY"):
    print("WARNING: OPENAI_API_KEY is not set. Chat will use fallback responses.")

# Configure SQLAlchemy
# Configure SQLAlchemy
database_url = os.getenv("DATABASE_URL")

if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    database_url or "sqlite:///instance/therapy_chatbot.db"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


# Initialize database
init_db(app)
import models
with app.app_context():
    db.create_all()

# Enable CORS
frontend_origins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
]
extra_origins = [
    origin.strip()
    for origin in os.getenv('FRONTEND_ORIGINS', '').split(',')
    if origin.strip()
]
frontend_origins.extend(extra_origins)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": frontend_origins,
            "allow_headers": ['Content-Type', 'Authorization'],
            "methods": ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        }
    },
)

# Legacy RAG chain setup (optional, if Pinecone is available)
try:
    RAG_ENABLED = os.environ.get("RAG_ENABLED", "false").lower() in ("1", "true", "yes")
    PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

    if OPENAI_API_KEY:
        try:
            from langchain_openai import ChatOpenAI

            chat_model = ChatOpenAI(model="gpt-4o")
        except Exception as exc:
            print(f"LLM init failed: {exc}")
            chat_model = None
    else:
        print("WARNING: OPENAI_API_KEY is not set. LLM will not initialize.")

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
            print(f"RAG chain setup failed: {e}.")
    else:
        if RAG_ENABLED:
            print("RAG keys missing. RAG chain will not initialize.")
except ImportError:
    print("RAG dependencies not available. Chat will use direct LLM if configured.")

if rag_chain:
    print("LLM ready: RAG chain enabled.")
elif chat_model:
    print("LLM ready: Direct chat model enabled.")
else:
    print("LLM not initialized.")


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
app.register_blueprint(journal_bp)
app.register_blueprint(chat_profile_bp)


# Health endpoint
@app.route('/api/health', methods=['GET'])
@app.route('/api/health/', methods=['GET'])
def health():
    """Health check endpoint."""
    try:
        db.session.execute(text('SELECT 1'))
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
    app.run(host='0.0.0.0', port=8000, debug=True)
