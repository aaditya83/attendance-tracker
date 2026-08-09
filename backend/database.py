from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db=client[os.getenv("DATABASE_NAME")]

subjects_collection = db["subjects"]
attendance_collection = db["attendance"]
timetable_collection = db["timetable"]
users_collection = db["users"]

