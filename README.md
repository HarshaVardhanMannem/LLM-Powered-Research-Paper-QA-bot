# LLM Powered Research Paper QA Bot

A sophisticated AI-powered application that allows users to ask questions about research papers and get intelligent responses based on the paper content. The system uses advanced NLP techniques including document embedding, vector search, and large language models to provide accurate and contextual answers.

## 🚀 Features

- **Intelligent Q&A**: Ask questions about research papers and get AI-powered responses
- **Document Upload**: Upload PDF research papers for analysis
- **ArXiv Integration**: Automatically fetch and process papers from ArXiv
- **Vector Search**: Advanced semantic search using FAISS vector database
- **Conversation History**: Maintain context across multiple questions
- **Feedback System**: Rate responses to improve system performance
- **Modern UI**: Clean, responsive interface with dark/light mode
- **Real-time Processing**: Fast response times with optimized retrieval

## 🏗️ Architecture

The application consists of two main components:

### Backend (FastAPI)
- **FastAPI** web framework for RESTful API
- **LangChain** for LLM orchestration
- **NVIDIA AI Endpoints** for LLM and embedding models
- **FAISS** for vector similarity search
- **PyMuPDF** for PDF processing
- **ArXiv API** for paper fetching

### Frontend (React)
- **React** with Material-UI components
- **Axios** for API communication
- **Real-time chat interface**
- **File upload functionality**
- **Responsive design**

## 📋 Prerequisites

Before running the application, ensure you have:

- **Python 3.9+** installed
- **Node.js 18+** installed
- **NVIDIA API Key** (for LLM and embedding models)
- **Git** for cloning the repository

## 🛠️ Installation & Setup

### Option 1: Local Development Setup

#### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LLM_Powered_Research_Paper_QA_Bot(FASTAPI)
   ```

2. **Navigate to backend directory**
   ```bash
   cd fastapi_app/backend
   ```

3. **Create and activate virtual environment**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

4. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```bash
   NVIDIA_API_KEY=your_nvidia_api_key_here
   ```

6. **Run the backend server**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

   The backend will be available at `http://localhost:8000`

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd fastapi_app/frontend
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Start the frontend development server**
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

### Option 2: Docker Setup

#### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LLM_Powered_Research_Paper_QA_Bot(FASTAPI)
   ```

2. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```bash
   NVIDIA_API_KEY=your_nvidia_api_key_here
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

   This will start both backend and frontend services:
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:3000`

#### Using Individual Dockerfiles

1. **Build and run backend**
   ```bash
   # Build backend image
   docker build --target backend -t research-qa-backend .

   # Run backend container
   docker run -p 8000:8000 -e NVIDIA_API_KEY=your_key research-qa-backend
   ```

2. **Build and run frontend**
   ```bash
   # Build frontend image
   docker build --target frontend -t research-qa-frontend .

   # Run frontend container
   docker run -p 3000:3000 research-qa-frontend
   ```

## 🔧 Configuration

### Backend Configuration

The main configuration is in `fastapi_app/backend/config/settings.py`:

- **LLM Model**: `mistralai/mixtral-8x22b-instruct-v0.1`
- **Embedding Model**: `nvidia/nv-embed-v1`
- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 100 characters
- **Pre-loaded Papers**: Configured ArXiv paper IDs

### Frontend Configuration

The frontend connects to the backend API at `http://localhost:8000` by default. This can be modified in `fastapi_app/frontend/src/App.js`.

## 📖 Usage

### Getting Started

1. **Access the application** at `http://localhost:3000`

2. **View loaded papers** in the sidebar to see available research papers

3. **Ask questions** in the chat interface about any of the loaded papers

4. **Upload new papers** using the upload functionality in the sidebar

5. **Add papers from ArXiv** by entering the paper ID

### Features

- **Chat Interface**: Type questions and get AI-powered responses
- **Paper Management**: View, upload, and manage research papers
- **Search**: Search through papers and chat history
- **Feedback**: Rate responses to help improve the system
- **Theme Toggle**: Switch between light and dark modes

## 🔍 API Endpoints

### Backend API (FastAPI)

- `GET /` - Health check
- `GET /papers` - Get list of loaded papers
- `POST /chat` - Send a question and get response
- `POST /papers/add` - Add a paper from ArXiv
- `POST /papers/upload` - Upload a PDF paper
- `POST /feedback` - Submit feedback on responses
- `GET /feedback/stats` - Get feedback statistics

## 🚀 Deployment

### Production Deployment

For production deployment, consider:

1. **Environment Variables**: Set proper production environment variables
2. **Database**: Use a production database instead of in-memory storage
3. **Security**: Implement proper authentication and authorization
4. **Monitoring**: Add logging and monitoring solutions
5. **SSL**: Configure HTTPS for secure communication

### Docker Production

```bash
# Build production images
docker build --target backend -t research-qa-backend:prod .
docker build --target frontend -t research-qa-frontend:prod .

# Run with production settings
docker run -d -p 8000:8000 -e NVIDIA_API_KEY=your_key research-qa-backend:prod
docker run -d -p 3000:3000 research-qa-frontend:prod
```

## 🧪 Testing

### Backend Testing

```bash
cd fastapi_app/backend
python -m pytest
```

### Frontend Testing

```bash
cd fastapi_app/frontend
npm test
```

## 📁 Project Structure

```
LLM_Powered_Research_Paper_QA_Bot(FASTAPI)/
├── fastapi_app/
│   ├── backend/
│   │   ├── config/
│   │   │   └── settings.py          # Configuration settings
│   │   ├── src/
│   │   │   ├── data/
│   │   │   │   └── document_loader.py # Document loading utilities
│   │   │   ├── embedding/
│   │   │   │   └── embeddings.py    # Embedding model setup
│   │   │   ├── prompts/
│   │   │   │   └── chat_prompts.py  # Chat prompt templates
│   │   │   ├── retrieval/
│   │   │   │   └── vector_store.py  # Vector store operations
│   │   │   └── utils/
│   │   │       ├── feedback_store.py # Feedback storage
│   │   │       └── helpers.py       # Utility functions
│   │   ├── main.py                  # FastAPI application
│   │   └── requirements.txt         # Python dependencies
│   └── frontend/
│       ├── src/
│       │   ├── components/          # React components
│       │   ├── hooks/              # Custom React hooks
│       │   └── App.js              # Main React application
│       └── package.json            # Node.js dependencies
├── Dockerfile                      # Multi-stage Docker build
├── docker-compose.yml              # Docker Compose configuration
└── README.md                       # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Backend not starting**: Check if NVIDIA API key is set correctly
2. **Frontend not connecting**: Ensure backend is running on port 8000
3. **Docker build fails**: Check if all dependencies are properly specified
4. **Memory issues**: Consider reducing chunk size or using smaller models

### Getting Help

- Check the logs for detailed error messages
- Ensure all prerequisites are installed
- Verify environment variables are set correctly
- Check network connectivity for API calls

## 🔮 Future Enhancements

- [ ] User authentication and authorization
- [ ] Support for more document formats
- [ ] Advanced search filters
- [ ] Export functionality
- [ ] Multi-language support
- [ ] Real-time collaboration features
- [ ] Advanced analytics and insights 