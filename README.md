# Attendance Tracker

A FastAPI-based attendance tracking system with AI-powered chat assistance for college students.

## Features

- **Subject Management**: Add, view, update, delete subjects with custom attendance requirements
- **Attendance Tracking**: Mark present/absent, view statistics per subject
- **Analytics**: Calculate attendance percentage, safe bunk count, classes needed to meet requirements
- **Timetable**: Manage class schedules by day and time
- **User Authentication**: JWT-based auth with secure password hashing
- **AI Assistant**: Natural language queries for attendance (e.g., "How many DBMS classes can I bunk?")

## Tech Stack

- **Backend**: FastAPI, Python 3.10+
- **Database**: MongoDB (via PyMongo)
- **Auth**: JWT (python-jose), Password hashing (pwdlib)
- **AI**: Hugging Face Inference API
- **Frontend**: Static HTML/CSS/JS (served via FastAPI)

## Project Structure

```
pr/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # MongoDB connection
│   ├── models.py            # Pydantic models
│   ├── security.py          # Password hashing & JWT
│   ├── depend.py            # Auth dependencies
│   ├── authroute.py         # Auth endpoints
│   ├── subroute.py          # Subject endpoints
│   ├── attroute.py          # Attendance endpoints
│   ├── anroute.py           # Analytics endpoints
│   ├── dashroute.py         # Dashboard endpoints
│   ├── timeroute.py         # Timetable endpoints
│   ├── profroute.py         # Professor endpoints
│   ├── airoute.py           # AI chat endpoints
│   └── attservice.py        # Attendance calculations
├── frontend/                # Static files (HTML/CSS/JS)
├── requirements.txt
└── .env                     # Environment variables (not committed)
```

## Setup

### Prerequisites

- Python 3.10+
- MongoDB (local or Atlas)
- Hugging Face API token (for AI features)

### Installation

```bash
# Clone and navigate
cd pr

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in `backend/`:

```env
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=attendance_tracker
SECRET_KEY=your-secret-key-here
api=your-huggingface-api-token
```

### Run the Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Server runs at `http://localhost:8000`

API docs at `http://localhost:8000/docs`

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login, returns JWT
- `GET /auth/me` - Get current user profile

### Subjects
- `POST /subjects/` - Create subject
- `GET /subjects/` - List all subjects
- `GET /subjects/{id}` - Get subject
- `PUT /subjects/{id}` - Update subject
- `DELETE /subjects/{id}` - Delete subject

### Attendance
- `POST /attendance/` - Mark attendance
- `GET /attendance/{subject_id}` - Get attendance records
- `PUT /attendance/{id}` - Update attendance
- `DELETE /attendance/{id}` - Delete attendance

### Analytics
- `GET /analytics/{subject_id}` - Attendance stats & predictions
- `GET /analytics/` - Overall attendance summary

### Timetable
- `POST /timetable/` - Add timetable entry
- `GET /timetable/` - Get timetable
- `DELETE /timetable/{id}` - Delete entry

### AI Chat
- `POST /ai/chat` - Natural language attendance queries

**Examples:**
- "What is my DBMS attendance?"
- "How many DBMS classes can I bunk?"
- "If I bunk 2 IT classes, what happens?"
- "Mark me present for today's IoT class"

## Frontend

Static files served from `/` route. Access the UI at `http://localhost:8000/pages/auth/login.html`

## License

MIT