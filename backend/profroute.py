from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import (
    users_collection,
    subjects_collection,
    attendance_collection,
)
from depend import get_current_user
from security import verify_password, hash_password
from models import profile
from models import ChangePassword

router=APIRouter(prefix="/profile",tags=["profile"])

@router.get("/")
def get_profile(current_user=Depends(get_current_user)):
    return {
        "id":str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"]
    }

@router.put("/")
def update_profile(data: profile, current_user=Depends(get_current_user)):
    if not data.username or not data.email:
        raise HTTPException(
            status_code=400,
            detail="Username and email are required"
        )
    existing = users_collection.find_one(
        {
            "email": data.email,
            "_id": {"$ne": current_user["_id"]}
        }
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": data.dict()
        }
    )
    user = users_collection.find_one(
        {"_id": current_user["_id"]}
    )
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"]
        }
    }

@router.put("/password")
def change_password(data: ChangePassword, current_user=Depends(get_current_user)):
    if not data.old_password or not  data.new_password:
        raise HTTPException(
            status_code=400,
            detail="Old and new password are required"
        )
    if not verify_password(
        data.old_password,
        current_user["password"]
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "password": hash_password(data.new_password)
            }
        }
    )
    return {
        "message": "Password changed successfully"
    }

@router.delete("/")
def delete_account(current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])

    subject_ids = [
        str(subject["_id"])
        for subject in subjects_collection.find(
            {"user_id": user_id}
        )
    ]
    attendance_collection.delete_many(
        {
            "subject_id": {
                "$in": subject_ids
            }
        }
    )
    subjects_collection.delete_many(
        {
            "user_id": user_id
        }
    )
    users_collection.delete_one(
        {
            "_id": current_user["_id"]
        }
    )
    return {
        "message": "Account deleted successfully"
    }
    