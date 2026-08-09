from fastapi import APIRouter, Depends
from database import timetable_collection,subjects_collection
from models import timetable
from bson import ObjectId
from depend import get_current_user

router = APIRouter(prefix="/timetable", tags=["timetable"])

def helper(timetable: timetable) -> dict:
    subject=subjects_collection.find_one({"_id": ObjectId(timetable["subject_id"])})
    return {
        "id": str(timetable["_id"]),
        "subject_id": timetable["subject_id"],
        "subject_name": subject["name"] if subject else None,
        "day": timetable["day"],
        "start_time": timetable["start_time"],
        "end_time": timetable["end_time"]
    }

@router.post("/")
def add_timetable_entry(entry: timetable, current_user = Depends(get_current_user)):
    d = entry.dict()
    d["user_id"] = str(current_user["_id"])
    r = timetable_collection.insert_one(d)
    newr = timetable_collection.find_one({"_id": r.inserted_id})
    return helper(newr)

@router.get("/")
def get_timetable(current_user = Depends(get_current_user)):
    tl=[]
    timetable_entries = timetable_collection.find({"user_id": str(current_user["_id"])})
    for entry in timetable_entries:
        tl.append(helper(entry))
    return tl

@router.get("/{day}")
def get_timetable_by_day(day: str, current_user = Depends(get_current_user)):
    tl=[]
    timetable_entries = timetable_collection.find({"day": day, "user_id": str(current_user["_id"])})
    for entry in timetable_entries:
        tl.append(helper(entry))
    return tl

@router.put("/{entry_id}")
def update_timetable_entry(entry_id: str, entry: timetable, current_user = Depends(get_current_user)):
    updated_entry = timetable_collection.update_one(
        {"_id": ObjectId(entry_id), "user_id": str(current_user["_id"])}, {"$set": entry.dict()})
    if updated_entry.matched_count == 1:
        return helper(timetable_collection.find_one({"_id": ObjectId(entry_id), "user_id": str(current_user["_id"])}))
    return {"error": "Timetable entry not found"}

@router.delete("/{entry_id}")
def delete_timetable_entry(entry_id: str, current_user = Depends(get_current_user)):
    deleted_entry = timetable_collection.delete_one({"_id": ObjectId(entry_id), "user_id": str(current_user["_id"])})
    if deleted_entry.deleted_count == 1:
        return {"message": "Timetable entry deleted successfully"}
    return {"error": "Timetable entry not found"}