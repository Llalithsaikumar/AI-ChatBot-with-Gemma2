from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import ollama
import json
import time
from datetime import datetime
import logging
import requests
import numpy as np
import faiss
import os
import re
from utils.time_helper import get_ist_time, get_ist_date, get_ist_datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
OLLAMA_MODEL = 'gemma2:2b'
OLLAMA_URL = "http://localhost:11434"
EMBED_MODEL = "mxbai-embed-large"  # Using the available model
MAX_TOKENS = 2048
TEMPERATURE = 0.7
TOP_K = 3

class RAGSystem:
    def __init__(self):
        self.store = None
        self.srec_keywords = [
            'srec', 'sree rama', 'rama engineering', 'college', 'tirupathi',
            'engineering', 'jntua', 'rami reddy', 'principal', 'department',
            'faculty', 'admission', 'courses', 'placement', 'campus', 'fees',
            'hostel', 'library', 'laboratory', 'sports', 'placement', 'faculty',
            'hod', 'chairman', 'address', 'contact', 'phone', 'email', 'website'
        ]
        self.load_srec_data()

    def load_srec_data(self):
        """Load and index SREC QA data"""
        try:
            # Load the JSON file
            if os.path.exists('srec_qa.json'):
                with open('srec_qa.json', 'r', encoding='utf-8') as f:
                    qa_data = json.load(f)

                logger.info(f"Loaded {len(qa_data)} SREC Q&A entries")
                self.store = self.ingest_and_index(qa_data)
                logger.info("SREC RAG system initialized successfully")
            else:
                logger.warning("srec_qa.json not found. RAG system disabled.")

        except Exception as e:
            logger.error(f"Failed to initialize RAG system: {e}")

    def make_docs_from_qa(self, qa_list):
        """Convert Q&A data to documents for indexing"""
        texts = []
        metas = []

        for i, qa in enumerate(qa_list):
            text = f"Q: {qa['question']}\nA: {qa['answer']}"
            texts.append(text)
            metas.append({"id": i, "question": qa['question'], "answer": qa['answer']})

        return texts, metas

    def embed_texts(self, texts, model=EMBED_MODEL):
        """Get embeddings using Ollama"""
        try:
            payload = {"model": model, "input": texts}
            r = requests.post(f"{OLLAMA_URL}/api/embed", json=payload, timeout=60)
            r.raise_for_status()
            js = r.json()

            # Handle different response formats
            if "embeddings" in js:
                return js["embeddings"]
            elif "data" in js and isinstance(js["data"], list):
                return [item.get("embedding", item.get("vector", [])) for item in js["data"]]
            elif isinstance(js, list):
                return js
            else:
                raise RuntimeError(f"Unexpected embedding response: {js}")

        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return None

    def build_faiss(self, embs):
        """Build FAISS index from embeddings"""
        arr = np.array(embs).astype("float32")
        faiss.normalize_L2(arr)
        dim = arr.shape[1]
        index = faiss.IndexFlatIP(dim)
        index.add(arr)
        return index, arr

    def ingest_and_index(self, qa_list):
        """Create embeddings and build search index"""
        texts, metas = self.make_docs_from_qa(qa_list)

        logger.info(f"Creating embeddings for {len(texts)} documents using {EMBED_MODEL}")
        embeddings = self.embed_texts(texts)

        if embeddings is None:
            raise Exception("Failed to create embeddings")

        logger.info("Building FAISS index...")
        index, emb_array = self.build_faiss(embeddings)

        return {
            "index": index,
            "emb_array": emb_array,
            "texts": texts,
            "metas": metas
        }

    def is_srec_question(self, query):
        """Check if query is about SREC"""
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in self.srec_keywords)

    def query_rag(self, query, top_k=TOP_K):
        """Query the RAG system for relevant context"""
        if not self.store:
            return None

        try:
            # Get query embedding
            q_emb = self.embed_texts([query])
            if not q_emb:
                return None

            q_arr = np.array(q_emb[0]).astype("float32")
            faiss.normalize_L2(q_arr.reshape(1, -1))

            # Search for similar documents
            D, I = self.store["index"].search(q_arr.reshape(1, -1), top_k)

            # Retrieve relevant documents
            retrieved = []
            for idx in I[0]:
                if idx < len(self.store["texts"]):
                    retrieved.append({
                        "meta": self.store["metas"][idx],
                        "text": self.store["texts"][idx],
                        "score": float(D[0][len(retrieved)])
                    })

            # Build context from retrieved documents
            context = "\n\n---\n\n".join([r["text"] for r in retrieved])

            return {
                "context": context,
                "retrieved": retrieved
            }

        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            return None

class ChatBot:
    def __init__(self):
        self.conversation_history = []
        self.max_history = 10
        self.rag_system = RAGSystem()

    def add_to_history(self, role, content):
        """Add message to conversation history"""
        self.conversation_history.append({
            'role': role,
            'content': content,
            'timestamp': {
                'time': get_ist_time(),
                'date': get_ist_date()
            }
        })

        # Keep only recent history to avoid context overflow
        if len(self.conversation_history) > self.max_history * 2:
            self.conversation_history = self.conversation_history[-self.max_history * 2:]

    def get_context_messages(self, user_message):
        """Get messages for context including current user message"""
        messages = self.conversation_history.copy()

        # Handle time-related queries
        time_keywords = ['time', 'current time', 'ist', 'indian standard time', 'what time', "what's the time", 'date', 'today']
        if any(keyword in user_message.lower() for keyword in time_keywords):
            current_time = get_ist_time()
            current_date = get_ist_date()
            time_message = {
                'role': 'system',
                'content': f"You are an AI assistant. The current time in IST is {current_time} and the date is {current_date}. Format your response professionally and include both time and date."
            }
            messages = [time_message]
            messages.append({'role': 'user', 'content': user_message})
            return messages

        # Check if this is an SREC-related question
        if self.rag_system.is_srec_question(user_message):
            rag_result = self.rag_system.query_rag(user_message)

            if rag_result and rag_result["context"]:
                # Create a system message with SREC context
                system_message = {
                    'role': 'system',
                    'content': f"""You are a helpful assistant with detailed knowledge about Sree Rama Engineering College (SREC). 
Use the following specific information to answer questions about SREC accurately:

{rag_result["context"]}

Important guidelines:
1. Answer questions about SREC using ONLY the provided context above
2. Be specific and accurate with details like names, numbers, dates, and contact information
3. If asked about SREC but the specific information is not in the context, say "I don't have that specific information about SREC"
4. For general questions not about SREC, respond normally as a helpful AI assistant
5. Always be helpful and provide complete answers when possible"""
                }
                messages = [system_message] + messages

        messages.append({'role': 'user', 'content': user_message})
        return messages

# Global chatbot instance
chatbot = ChatBot()

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        models = ollama.list()
        rag_status = "enabled" if chatbot.rag_system.store else "disabled"

        return jsonify({
            'status': 'healthy',
            'model': OLLAMA_MODEL,
            'embed_model': EMBED_MODEL,
            'message': 'Enhanced Chatbot API is running',
            'models_available': len(models.get('models', [])),
            'rag_system': rag_status,
            'srec_data_loaded': chatbot.rag_system.store is not None
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Main chat endpoint with streaming response and RAG support"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400

        user_message = data['message'].strip()
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400

        logger.info(f"Received message: {user_message[:100]}...")

        def generate_response():
            try:
                # Get conversation context (includes RAG context if applicable)
                messages = chatbot.get_context_messages(user_message)

                # Stream response from Ollama
                response_content = ""
                response_stream = ollama.chat(
                    model=OLLAMA_MODEL,
                    messages=messages,
                    stream=True,
                    options={
                        'temperature': TEMPERATURE,
                        'top_p': 0.9,
                        'num_ctx': MAX_TOKENS,
                        'repeat_penalty': 1.1,
                        'seed': -1
                    }
                )

                for chunk in response_stream:
                    if chunk.get('done', False):
                        break

                    content = chunk.get('message', {}).get('content', '')
                    if content:
                        response_content += content
                        yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"

                # Add to conversation history
                chatbot.add_to_history('user', user_message)
                chatbot.add_to_history('assistant', response_content)

                # Send completion signal
                yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"
                logger.info(f"Response completed. Length: {len(response_content)}")

            except Exception as e:
                logger.error(f"Error generating response: {str(e)}")
                error_response = {
                    'error': 'Sorry, I encountered an error while generating the response. Please try again.',
                    'done': True
                }
                yield f"data: {json.dumps(error_response)}\n\n"

        return Response(
            stream_with_context(generate_response()),
            content_type='text/plain',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no'
            }
        )

    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/chat/simple', methods=['POST'])
def chat_simple():
    """Non-streaming chat endpoint with RAG support"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400

        user_message = data['message'].strip()
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400

        # Get conversation context (includes RAG context if applicable)
        messages = chatbot.get_context_messages(user_message)

        # Get complete response
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=messages,
            stream=False,
            options={
                'temperature': TEMPERATURE,
                'top_p': 0.9,
                'num_ctx': MAX_TOKENS,
                'repeat_penalty': 1.1
            }
        )

        response_content = response['message']['content']

        # Add to conversation history
        chatbot.add_to_history('user', user_message)
        chatbot.add_to_history('assistant', response_content)

        # Check if RAG was used
        is_srec_query = chatbot.rag_system.is_srec_question(user_message)

        return jsonify({
            'response': response_content,
            'success': True,
            'used_rag': is_srec_query,
            'rag_available': chatbot.rag_system.store is not None
        })

    except Exception as e:
        logger.error(f"Simple chat error: {str(e)}")
        return jsonify({
            'error': 'Sorry, I encountered an error. Please try again.',
            'success': False
        }), 500

@app.route('/chat/clear', methods=['POST'])
def clear_history():
    """Clear conversation history"""
    try:
        chatbot.conversation_history.clear()
        return jsonify({
            'message': 'Conversation history cleared',
            'success': True
        })
    except Exception as e:
        logger.error(f"Clear history error: {str(e)}")
        return jsonify({'error': 'Failed to clear history'}), 500

@app.route('/status', methods=['GET'])
def get_status():
    """Get chatbot status and model info"""
    try:
        models_response = ollama.list()
        logger.info(f"Ollama models response: {models_response}")

        model_info = None
        available_models = []

        models_list = models_response.get('models', [])
        for model in models_list:
            if isinstance(model, dict):
                model_name = model.get('name') or model.get('model') or model.get('id', 'unknown')
                available_models.append(model_name)

                if OLLAMA_MODEL in model_name:
                    model_info = {
                        'name': model_name,
                        'size': model.get('size', 'unknown'),
                        'modified': model.get('modified_at', model.get('updated_at', 'unknown'))
                    }

        return jsonify({
            'model': OLLAMA_MODEL,
            'embed_model': EMBED_MODEL,
            'model_info': model_info,
            'available_models': available_models,
            'conversation_length': len(chatbot.conversation_history),
            'status': 'ready',
            'connected': True,
            'rag_system': {
                'enabled': chatbot.rag_system.store is not None,
                'srec_data_loaded': chatbot.rag_system.store is not None,
                'documents_indexed': len(chatbot.rag_system.store['texts']) if chatbot.rag_system.store else 0
            }
        })

    except Exception as e:
        logger.error(f"Status error: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'connected': False
        }), 500

@app.route('/api/health', methods=['GET'])
def api_health():
    """Simple health endpoint"""
    return jsonify({'status': 'ok', 'timestamp': time.time()})

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🤖 Starting Enhanced RAG-Enabled Chatbot API Server...")
    print(f"📦 LLM Model: {OLLAMA_MODEL}")
    print(f"🔍 Embedding Model: {EMBED_MODEL}")
    print(f"🌡️ Temperature: {TEMPERATURE}")
    print(f"📝 Max Tokens: {MAX_TOKENS}")
    print("🔗 Endpoints:")
    print("   GET  / - Health check")
    print("   GET  /api/health - API health")
    print("   POST /chat - Streaming chat with RAG")
    print("   POST /chat/simple - Simple chat with RAG")
    print("   POST /chat/clear - Clear history")
    print("   GET  /status - Get detailed status")
    print("\n🚀 Server starting on http://localhost:5000")

    try:
        # Test Ollama connection
        models = ollama.list()
        print("✅ Ollama connection successful")
        print(f"📋 Available models: {len(models.get('models', []))}")

        # Check for required models
        models_list = models.get('models', [])
        llm_found = embed_found = False

        for model in models_list:
            if isinstance(model, dict):
                model_name = model.get('name', str(model))
                if OLLAMA_MODEL in model_name:
                    print(f"✅ LLM model found: {model_name}")
                    llm_found = True
                if EMBED_MODEL in model_name:
                    print(f"✅ Embedding model found: {model_name}")
                    embed_found = True

        if not llm_found:
            print(f"⚠️  Warning: LLM model '{OLLAMA_MODEL}' not found!")
            print(f"   Run: ollama pull {OLLAMA_MODEL}")

        if not embed_found:
            print(f"⚠️  Warning: Embedding model '{EMBED_MODEL}' not found!")
            print(f"   Run: ollama pull {EMBED_MODEL}")

        # Check SREC data file
        if os.path.exists('srec_qa.json'):
            print("✅ SREC Q&A data file found")
        else:
            print("⚠️  Warning: srec_qa.json not found - RAG system will be disabled")

    except Exception as e:
        print(f"❌ Warning: Could not connect to Ollama: {e}")
        print("   Make sure Ollama is running: 'ollama serve'")

    # Install required packages reminder
    print("\n📦 Required packages:")
    print("   pip install numpy faiss-cpu requests")

    # Run the Flask app
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )
