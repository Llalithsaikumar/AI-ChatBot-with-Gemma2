# AI Chatbot with Gemma2 and Local RAG

<div align="center">

![Neural AI Logo](frontend/brain.png)

[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![Flask Version](https://img.shields.io/badge/flask-2.0%2B-green.svg)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](README.md#contributing)

</div>

A full-stack, Retrieval-Augmented Generation (RAG) powered chatbot application for campus information. This AI system answers campus-specific questions using a local Q&A dataset and the Gemma2:2b model via Ollama. It also works as a general-purpose chatbot for unrelated queries.

---

## 📑 Table of Contents

- [✨ Features](#features)
- [🏗️ Project Structure](#project-structure)
- [⚙️ Installation](#installation)
    - [Install Ollama](#install-ollama)
    - [Pull AI Models](#pull-ai-models)
    - [Install Python Dependencies](#install-python-dependencies)
- [🚀 Running the App](#running-the-app)
- [🔄 How RAG Works](#how-retrieval-augmented-generation-rag-works)
- [🛠️ Customization](#customization)
- [🧪 Testing](#testing)
- [❓ FAQ](#faq)
- [🤝 Contributing](#contributing)
- [📄 License](#license)

---

## ✨ Features

- **🎯 Accurate Campus Answers**: Leverages custom Q&A file (`campus_qa.json`) using RAG
- **🤖 General AI Chat**: Powered by Gemma2:2b for any topic
- **🧠 Session-based Memory**: Context-aware responses during conversations
- **⚡ Fast & Private**: No cloud dependencies, runs completely local
- **🎨 Modern UI**: Clean, responsive frontend with real-time updates

---

## 🏗️ Project Structure

\`\`\`
your-project/
├── app.py                   # Flask backend (RAG + chat endpoints)
├── campus_qa.json          # Campus Q&A dataset
├── requirements.txt        # Python dependencies
├── test_chatbot.py        # Unit tests
└── Frontend/
    ├── index.html         # Main UI
    ├── app.js            # Frontend logic
    └── style.css         # UI styling
\`\`\`

---

## ⚙️ Installation

### Install Ollama

Choose your platform:

<details>
<summary>📦 Windows</summary>

1. Download from [ollama.com/download](https://ollama.com/download)
2. Run the installer
3. Start Ollama from Start Menu

</details>

<details>
<summary>🐧 Linux</summary>

\`\`\`bash
curl -fsSL https://ollama.com/install.sh | sh
\`\`\`

</details>

<details>
<summary>🍎 macOS</summary>

\`\`\`bash
curl -fsSL https://ollama.com/install.sh | sh
\`\`\`

</details>

### Pull AI Models

\`\`\`bash
# Pull required models
ollama pull gemma2:2b
ollama pull mxbai-embed-large

# Verify installation
ollama list
\`\`\`

### Install Python Dependencies

\`\`\`bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\\Scripts\\activate   # Windows

# Install dependencies
pip install -r requirements.txt
\`\`\`

---

## 🚀 Running the App

1. **Start Ollama Server**
   \`\`\`bash
   ollama serve
   \`\`\`

2. **Launch Backend**
   \`\`\`bash
   python app.py
   \`\`\`

3. **Access the UI**
   - Open [http://localhost:5000](http://localhost:5000)
   - Start chatting! 💬

---

## 🔄 How Retrieval-Augmented Generation (RAG) Works

1. **Question Analysis** 🔍
   - Detects campus-specific queries
   - Routes general queries to standard chat

2. **Vector Search** 📊
   - Embeds questions using mxbai-embed-large
   - Performs similarity search in campus Q&A

3. **Context Injection** 🎯
   - Enriches prompts with relevant campus info
   - Ensures accurate, grounded responses

4. **Response Generation** ✨
   - Uses Gemma2:2b for natural language
   - Maintains conversation context

---

## 🛠️ Customization

### Adding Campus Knowledge
\`\`\`json
// campus_qa.json
{
  "questions": [
    {
      "q": "What are the campus timings?",
      "a": "Your custom answer here"
    }
  ]
}
\`\`\`

### Model Configuration
- Swap models in \`app.py\`:
\`\`\`python
CHAT_MODEL = "gemma2:2b"  # Or any Ollama model
EMBED_MODEL = "mxbai-embed-large"
\`\`\`

---

## 🧪 Testing

Run the test suite:
\`\`\`bash
python test_chatbot.py
\`\`\`

API Testing:
\`\`\`bash
# Health check
curl http://localhost:5000/health

# Chat endpoint
curl -X POST http://localhost:5000/chat/simple \\
     -H "Content-Type: application/json" \\
     -d '{"message": "What are the campus timings?"}'
\`\`\`

---

## ❓ FAQ

<details>
<summary><b>Q: How is data privacy maintained?</b></summary>
All processing happens locally. No data leaves your system.
</details>

<details>
<summary><b>Q: Can I extend the campus knowledge?</b></summary>
Yes! Add Q&A pairs to campus_qa.json.
</details>

<details>
<summary><b>Q: What's the recommended hardware?</b></summary>
- RAM: 8GB minimum, 16GB recommended
- GPU: Optional, CPU works fine
- Storage: 10GB for models
</details>

---

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
<p>Built with ❤️ using Gemma2 and Flask</p>
</div>
