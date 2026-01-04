# Vantage-Search

A professional video search platform powered by AI vision models. Index your video library and search for moments using natural language queries.

## ✨ Features

### 🔍 Natural Language Search
- Search across your entire video library using plain English
- AI-powered CLIP embeddings for semantic understanding
- View matching clips with precise timestamps
- Video playback directly in search results

### 📚 Video Library Management
- Upload and manage your video collection
- Real-time indexing status tracking
- View video thumbnails and metadata
- Monitor processing progress

### 🎯 Smart Object Detection
- Automatic detection of objects, people, and scenes
- YOLOv11 integration for accurate tagging
- Filter and discover content by detected objects

### 🎨 Modern, Professional UI
- Clean, responsive design
- Smooth animations and transitions
- Optimized for desktop and mobile
- Dark mode color scheme

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd Vantage-Search

# Start the application
docker-compose up --build
```

- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:8000

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📖 Usage Guide

### 1. Upload Videos
Navigate to the **Upload** tab and select video files to index. The system will:
- Extract frames at regular intervals
- Generate CLIP embeddings for semantic search
- Detect objects using YOLOv11
- Store metadata in ChromaDB

### 2. Browse Library
View your video collection in the **Library** tab:
- See processing status for each video
- Check file size and upload date
- Monitor indexing progress

### 3. Search for Moments
Use the **Search** tab to find specific moments:
- Enter natural language queries (e.g., "person walking", "red car")
- View results with relevance scores
- Play videos at exact match timestamps
- See detected objects in each frame

## 🏗️ Architecture

```
Vantage-Search/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI endpoints
│   │   ├── db/            # ChromaDB vector store
│   │   ├── services/      # Indexing & search services
│   │   └── main.py
│   ├── data/              # Videos and metadata
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main application
│   │   ├── Search.jsx     # Search interface
│   │   ├── Library.jsx    # Video library
│   │   ├── Upload.jsx     # Upload interface
│   │   └── index.css      # Professional styling
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## 🔧 Configuration

### Backend Settings
The indexing pipeline can be configured in `backend/app/services/indexing.py`:
- **Embedding model**: CLIP ViT-B/32
- **Detection model**: YOLOv11-seg ONNX
- **Frame sampling**: Every 30 frames (~1 second)
- **Default vocabulary**: person, car, dog, cat, chair

### Frontend Settings
API endpoints are configured to use `http://localhost:8000`. For production:
- Update API URLs in components
- Configure CORS in backend
- Set up proper authentication

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **ChromaDB**: Vector database for embeddings
- **CLIP**: OpenAI's vision-language model
- **YOLOv11**: State-of-the-art object detection
- **vision-tools**: Custom ML inference pipeline

### Frontend
- **React**: UI library
- **Vite**: Build tool and dev server
- **Modern CSS**: Professional styling with animations

## 📝 API Endpoints

- `POST /api/upload` - Upload and index a video
- `GET /api/search?q={query}&limit={n}` - Search for video moments
- `GET /api/videos` - List all uploaded videos
- `GET /api/videos/{video_id}` - Stream a specific video
- `DELETE /api/reset` - Clear the database

## 🎯 Roadmap

- [ ] Thumbnail extraction for each indexed frame
- [ ] Advanced filtering (date, duration, objects)
- [ ] Multi-video clip compilation
- [ ] Custom vocabulary for detection
- [ ] User authentication
- [ ] Cloud deployment guide
- [ ] Batch processing improvements

## 📄 License

See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI CLIP](https://github.com/openai/CLIP) - Vision-language model
- [Ultralytics YOLOv11](https://github.com/ultralytics/ultralytics) - Object detection
- [ChromaDB](https://www.trychroma.com/) - Vector database
