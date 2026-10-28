from fastapi import APIRouter,Depends
from depend import get_current_user
from models import Subject
from database import subjects_collection
from bson import ObjectId

router = APIRouter(prefix="/subjects", tags=["subjects"])

def subject_helper(subject: Subject) -> dict:
    return {
        "id": str(subject["_id"]),
        "name": subject["name"],
        "faculty": subject["faculty"],
        "required_attendance": subject["required_attendance"]
    }

@router.post("/")
def add_subject(subject: Subject, current_user = Depends(get_current_user)):
    d=subject.dict()
    d["user_id"]=str(current_user["_id"])
    r=subjects_collection.insert_one(d)
    newr=subjects_collection.find_one({"_id": r.inserted_id})
    return subject_helper(newr)

@router.get("/")
def get_subjects(current_user = Depends(get_current_user)):
    subjects = subjects_collection.find({
        "user_id": str(current_user["_id"])
    })
    return [subject_helper(subject) for subject in subjects]

@router.get("/{subject_id}")
def get_subject(subject_id: str, current_user = Depends(get_current_user)):
    subject = subjects_collection.find_one({"_id": ObjectId(subject_id), "user_id": str(current_user["_id"])})
    if subject:
        return subject_helper(subject)
    return {"error": "Subject not found"}

@router.put("/{subject_id}")
def update_subject(subject_id: str, subject: Subject, current_user = Depends(get_current_user)):
    updated_subject = subjects_collection.update_one(
        {"_id": ObjectId(subject_id), "user_id": str(current_user["_id"])}, {"$set": subject.dict()})
    if updated_subject.matched_count == 1:
            return subject_helper(subjects_collection.find_one({"_id": ObjectId(subject_id)}))
    return {"error": "Subject not found"}

@router.delete("/{subject_id}")
def delete_subject(subject_id: str, current_user = Depends(get_current_user)):
    deleted_subject = subjects_collection.delete_one({"_id": ObjectId(subject_id), "user_id": str(current_user["_id"])})
    if deleted_subject.deleted_count == 1:
        return {"message": "Subject deleted successfully"}
    return {"error": "Subject not found"}