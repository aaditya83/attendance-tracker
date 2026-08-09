from bson import ObjectId
from database import (
    subjects_collection,
    attendance_collection
)

def calculate_attendance(subject_id, current_user):

    user_id = str(current_user["_id"])

    subject = subjects_collection.find_one({
        "_id": ObjectId(subject_id),
        "user_id": user_id
    })

    if not subject:
        return {
            "subject_name": "Unknown",
            "present": 0,
            "absent": 0,
            "total_classes": 0,
            "attendance_percentage": 0,
            "required_attendance": 75,
            "classes_needed": 0,
            "safe_bunks": 0
        }

    records = list(
        attendance_collection.find({
            "subject_id": subject_id,
            "user_id": user_id
        })
    )

    present = sum(
        1 for record in records
        if record["status"].lower() == "present"
    )

    absent = sum(
        1 for record in records
        if record["status"].lower() == "absent"
    )

    total_classes = present + absent

    if total_classes > 0:
        percentage = round(
            (present / total_classes) * 100,
            2
        )
    else:
        percentage = 0

    required = subject.get(
        "required_attendance",
        75
    )

    classes_needed = 0

    if percentage < required:

        if total_classes == 0:
            # No classes yet - need 1 class to reach any percentage >= required
            classes_needed = 1
        else:
            while (
                (present + classes_needed) /
                (total_classes + classes_needed)
            ) * 100 < required:

                classes_needed += 1

    safe_bunks = 0

    while total_classes + safe_bunks > 0:

        future_percentage = (
            present /
            (total_classes + safe_bunks)
        ) * 100

        if future_percentage < required:
            break

        safe_bunks += 1

    if safe_bunks > 0:
        safe_bunks -= 1

    return {
        "subject_id": str(subject["_id"]),
        "subject_name": subject["name"],
        "present": present,
        "absent": absent,
        "total_classes": total_classes,
        "attendance_percentage": percentage,
        "required_attendance": required,
        "classes_needed": classes_needed,
        "safe_bunks": safe_bunks
    }

