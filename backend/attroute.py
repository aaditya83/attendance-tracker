from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from models import attendance
from database import attendance_collection, subjects_collection
from depend import get_current_user

router = APIRouter(prefix="/attendance", tags=["attendance"])

def attendance_helper(record):
    return {
        "id": str(record["_id"]),
        "subject_id": record["subject_id"],
        "date": record["date"],
        "status": record["status"]
    }

@router.post("/")
def add_attendance(
    payload: attendance,
    current_user=Depends(get_current_user)
):
    user_id = str(current_user["_id"])

    subject = subjects_collection.find_one({
        "_id": ObjectId(payload.subject_id),
        "user_id": user_id
    })

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    status = payload.status.strip().lower()

    if status not in {"present", "absent"}:
        raise HTTPException(
            status_code=400,
            detail="Status must be present or absent"
        )

    existing = attendance_collection.find_one({
        "subject_id": payload.subject_id,
        "date": payload.date,
        "user_id": user_id
    })

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for this date"
        )

    data = payload.model_dump()

    data["status"] = status
    data["user_id"] = user_id

    result = attendance_collection.insert_one(data)

    record = attendance_collection.find_one({
        "_id": result.inserted_id
    })

    return attendance_helper(record)

@router.get("/")
def get_attendance(
    current_user=Depends(get_current_user)
):
    user_id = str(current_user["_id"])

    records = attendance_collection.find({
        "user_id": user_id
    })

    return [
        attendance_helper(record)
        for record in records
    ]

@router.get("/{attendance_id}")
def get_attendance_record(
    attendance_id: str,
    current_user=Depends(get_current_user)
):
    user_id = str(current_user["_id"])

    if not ObjectId.is_valid(attendance_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid attendance ID"
        )

    record = attendance_collection.find_one({
        "_id": ObjectId(attendance_id),
        "user_id": user_id
    })

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    return attendance_helper(record)

@router.put("/{attendance_id}")
def update_attendance(
    attendance_id: str,
    payload: attendance,
    current_user=Depends(get_current_user)
):
    user_id = str(current_user["_id"])

    if not ObjectId.is_valid(attendance_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid attendance ID"
        )

    status = payload.status.strip().lower()

    if status not in {"present", "absent"}:
        raise HTTPException(
            status_code=400,
            detail="Status must be present or absent"
        )

    result = attendance_collection.update_one(
        {
            "_id": ObjectId(attendance_id),
            "user_id": user_id
        },
        {
            "$set": {
                "subject_id": payload.subject_id,
                "date": payload.date,
                "status": status
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    record = attendance_collection.find_one({
        "_id": ObjectId(attendance_id)
    })

    return attendance_helper(record)


@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: str,
    current_user=Depends(get_current_user)
):
    user_id = str(current_user["_id"])

    if not ObjectId.is_valid(attendance_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid attendance ID"
        )

    result = attendance_collection.delete_one({
        "_id": ObjectId(attendance_id),
        "user_id": user_id
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    return {
        "message": "Attendance record deleted successfully"
    }

