# Attendance Tracker

Attendance Tracker is a full-stack attendance management application built with FastAPI and MongoDB. It provides subject and timetable management, attendance records, analytics, Excel import/export, profile management, and an AI-assisted chat interface.

## Features

- JWT authentication with account registration and login
- Subject management with configurable attendance thresholds
- Attendance entry management and historical records
- Dashboard and per-subject attendance analytics
- Safe-bunk and required-class calculations
- Daily timetable management
- Excel template download, attendance export, and bulk import
- Profile updates, password changes, and account deletion
- AI chat for attendance summaries and common planning questions
- Responsive static frontend served directly by FastAPI

## Tech Stack

- **Backend:** FastAPI, Pydantic
- **Database:** MongoDB through PyMongo
- **Caching:** Redis
- **Authentication:** JWT and password hashing
- **AI:** Hugging Face Inference API
- **Excel:** openpyxl
- **Frontend:** HTML, CSS, and JavaScript

## Requirements

- Python 3.10 or later
- MongoDB
- Redis
- A Hugging Face API token for AI chat

> Redis is used for analytics caching and must be running at `localhost:6379` for analytics routes to work. The AI token is optional for non-AI features.

## Getting Started

### 1. Clone and create a virtual environment

```bash
git clone https://github.com/aaditya83/attendance-tracker.git
cd attendance-tracker
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

The current requirements cover the core application; ensure `openpyxl` and `redis` are installed if they are not already present:

```bash
pip install openpyxl redis
```

### 3. Configure environment variables

Create a `.env` file in `backend/`:

```env
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=attendance_tracker
SECRET_KEY=replace-with-a-long-random-secret
api=replace-with-your-huggingface-token
```

Generate a suitable JWT secret locally with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4. Start Redis and MongoDB

Start MongoDB and Redis using your local installation or hosted service. For a local Redis instance on Windows, macOS, or Linux, ensure it accepts connections on `localhost:6379`.

### 5. Run the application

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Open:

- Application: http://localhost:8000
- API documentation: http://localhost:8000/docs
- Alternative API schema: http://localhost:8000/redoc

## Project Structure

```text
attendance-tracker/
├── backend/
│   ├── main.py           # FastAPI application and static frontend mount
│   ├── database.py       # MongoDB collections
│   ├── models.py         # Request and response schemas
│   ├── security.py       # Password hashing and JWT signing
│   ├── depend.py         # Authentication dependencies
│   ├── authroute.py      # Registration and login
│   ├── subroute.py       # Subject CRUD
│   ├── attroute.py       # Attendance CRUD
│   ├── anroute.py        # Attendance analytics and cache
│   ├── dashroute.py      # Dashboard summary
│   ├── timeroute.py      # Timetable CRUD
│   ├── profroute.py      # Profile management
│   ├── airoute.py        # AI chat
│   ├── exroute.py        # Excel template, upload, and download
│   ├── attservice.py     # Attendance calculations
│   └── redis_client.py   # Redis cache helpers
├── frontend/
│   ├── js/               # Shared authentication and route guard
│   └── pages/            # Login, register, dashboard, and feature pages
├── requirements.txt
└── .env                  # Local secrets, not committed
```

## API Overview

Protected endpoints require a bearer token returned by `POST /auth/login`.

| Area | Methods and paths |
| --- | --- |
| Authentication | `POST /auth/register`, `POST /auth/login`, `GET /auth/users`, `GET /auth/me` |
| Profile | `GET /profile/`, `PUT /profile/`, `PUT /profile/password`, `DELETE /profile/` |
| Subjects | `POST /subjects/`, `GET /subjects/`, `GET /subjects/{subject_id}`, `PUT /subjects/{subject_id}`, `DELETE /subjects/{subject_id}` |
| Attendance | `POST /attendance/`, `GET /attendance/`, `GET /attendance/{attendance_id}`, `PUT /attendance/{attendance_id}`, `DELETE /attendance/{attendance_id}` |
| Dashboard | `GET /dashboard/` |
| Analytics | `GET /analytics/{subject_id}` (use `all` for every subject) |
| Timetable | `POST /timetable/`, `GET /timetable/`, `GET /timetable/{day}`, `PUT /timetable/{entry_id}`, `DELETE /timetable/{entry_id}` |
| Excel | `GET /excel/template`, `GET /excel/download`, `POST /excel/upload` |
| AI assistant | `POST /ai/chat` |

FastAPI also exposes the complete interactive schema at `/docs`.

## Excel Workflow

1. Download the template from `GET /excel/template`.
2. Enter subject names, dates in `YYYY-MM-DD` format, and either `Present` or `Absent`.
3. Upload the completed `.xlsx` file to `POST /excel/upload`.
4. Download the user's saved records from `GET /excel/download`.

Upload data is accepted only in `.xlsx` format.

## AI Chat Examples

Send a JSON object to `POST /ai/chat`:

```json
{
  "message": "How many DBMS classes can I bunk?"
}
```

The assistant can answer attendance questions such as:

- "What is my DBMS attendance?"
- "How many IT classes can I bunk?"
- "If I bunk 2 classes, what happens?"
- "Mark me present for today's IoT class"

## Development Notes

- Run commands from the repository root unless a command explicitly changes directory.
- Environment variables are loaded from `.env`; keep secrets out of version control.
- Backend static paths assume the server is started from `backend/` (`uvicorn main:app`) so `../frontend` resolves correctly.
- Automated tests are not currently included in the repository.