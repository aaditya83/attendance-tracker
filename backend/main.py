from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from database import client, db, subjects_collection, attendance_collection
from subroute import router as subjects_router
from attroute import router as attendance_router
from anroute import router as analytics_router
from dashroute import router as dashboard_router
from timeroute import router as timetable_router
from authroute import router as auth_router
from profroute import router as prof_router
from airoute import router as ai_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(subjects_router)
app.include_router(attendance_router)
app.include_router(analytics_router)
app.include_router(dashboard_router)
app.include_router(timetable_router)
app.include_router(auth_router)
app.include_router(prof_router)
app.include_router(ai_router)

@app.get("/")
async def read_root():
    return RedirectResponse(url="/pages/auth/login.html")

app.mount("/", StaticFiles(directory="../frontend"), name="frontend")

