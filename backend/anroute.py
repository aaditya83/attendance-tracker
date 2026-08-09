from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database import subjects_collection
from depend import get_current_user
from attservice import calculate_attendance

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)

@router.get("/{subject_id}")
def analytics(
    subject_id: str,
    current_user=Depends(get_current_user)
):
    user_id = str(current_user["_id"])

    if subject_id == "all":

        results = []

        subjects = subjects_collection.find({
            "user_id": user_id
        })

        for subject in subjects:

            result = calculate_attendance(
                str(subject["_id"]),
                current_user
            )

            results.append(result)

        return {
            "type": "all",
            "subjects": results
        }

    if not ObjectId.is_valid(subject_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid subject ID"
        )

    subject = subjects_collection.find_one({
        "_id": ObjectId(subject_id),
        "user_id": user_id
    })

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    result = calculate_attendance(
        subject_id,
        current_user
    )

    return {
        "type": "subject",
        "data": result
    }

