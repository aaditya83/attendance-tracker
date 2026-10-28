from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from huggingface_hub import InferenceClient
from database import subjects_collection, attendance_collection,subjects_collection
from depend import get_current_user
from datetime import date
import os
import re

router = APIRouter(prefix="/ai", tags=["AI"])

client = InferenceClient(
    token=os.getenv("api")
)

class AIRequest(BaseModel):
    message: str

def get_attendance_summary(user_id, subject_id=None):

    query = {
        "user_id": user_id
    }

    if subject_id:
        query["subject_id"] = subject_id

    records = list(
        attendance_collection.find(query)
    )

    total = len(records)

    present = sum(
        1
        for record in records
        if record["status"].lower() == "present"
    )

    absent = total - present

    percentage = (
        (present / total) * 100
        if total > 0
        else 0
    )

    return {
        "present": present,
        "absent": absent,
        "total": total,
        "percentage": round(percentage, 2)
    }

def extract_required_percentage(message):
    patterns = [
        r"(?:maintain|keep|reach|at least)\s+(\d+(?:\.\d+)?)\s*%",
        r"(\d+(?:\.\d+)?)\s*%\s*(?:attendance|minimum)"
    ]

    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)

        if match:
            percentage = float(match.group(1))

            if 0 < percentage <= 100:
                return percentage

    return 75.0

def find_subject_from_message(user_id, message):
    subjects = subjects_collection.find({
        "user_id": user_id
    })

    for subject in subjects:
        if subject["name"].lower() in message.lower():
            return subject

    return None

def calculate_future_attendance(
    user_id,
    subject_id,
    future_present,
    future_total
):
    records = list(attendance_collection.find({
        "user_id": user_id,
        "subject_id": subject_id
    }))

    total = len(records)

    present = sum(
        1
        for record in records
        if record["status"].lower() == "present"
    )

    if total == 0:
        return {
            "possible": False,
            "message": "No attendance records found for this subject."
        }

    new_present = present + future_present
    new_total = total + future_total

    new_percentage = (
        new_present / new_total
    ) * 100

    return {
        "possible": True,
        "current_present": present,
        "current_total": total,
        "current_percentage": round(
            (present / total) * 100, 2
        ),
        "future_present": future_present,
        "future_total": future_total,
        "new_present": new_present,
        "new_total": new_total,
        "new_percentage": round(
            new_percentage, 2
        )
    }

def get_subject_attendance(user_id, subject_id):
    records = list(attendance_collection.find({
        "user_id": user_id,
        "subject_id": subject_id
    }))

    total = len(records)

    present = sum(
        1
        for record in records
        if record["status"].lower() == "present"
    )

    absent = total - present

    percentage = (
        (present / total) * 100
        if total > 0
        else 0
    )

    return {
        "present": present,
        "absent": absent,
        "total": total,
        "percentage": round(percentage, 2)
    }

def calculate_safe_bunk(user_id, subject_id, required_percentage=75):

    attendance = attendance_collection.find({
        "user_id": user_id,
        "subject_id": subject_id
    })

    records = list(attendance)

    total = len(records)
    present = sum(
        1 for record in records
        if record["status"].lower() == "present"
    )

    if total == 0:
        return {
            "possible": False,
            "message": "No attendance records found for this subject."
        }

    current_percentage = (present / total) * 100

    max_bunk = 0

    while (
        present / (total + max_bunk + 1) * 100
        >= required_percentage
    ):
        max_bunk += 1

    final_percentage = (
        present / (total + max_bunk) * 100
    )

    return {
        "possible": True,
        "present": present,
        "total": total,
        "current_percentage": round(current_percentage, 2),
        "max_bunk": max_bunk,
        "final_percentage": round(final_percentage, 2),
        "required_percentage": required_percentage
    }
def extract_bunk_count(message):
    patterns = [
        r"bunk\s+(\d+)\s+classes?",
        r"bunk\s+(\d+)",
        r"skip\s+(\d+)\s+classes?",
        r"skip\s+(\d+)",
        r"miss\s+(\d+)\s+classes?",
        r"miss\s+(\d+)"
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            message,
            re.IGNORECASE
        )

        if match:
            return int(match.group(1))

    words = {
        "one": 1,
        "two": 2,
        "three": 3,
        "four": 4,
        "five": 5,
        "six": 6,
        "seven": 7,
        "eight": 8,
        "nine": 9,
        "ten": 10
    }

    for word, number in words.items():
        if re.search(
            rf"\b{word}\b",
            message,
            re.IGNORECASE
        ):
            return number

    return None


def calculate_attendance(user_id):
    subjects = list(
        subjects_collection.find({
            "user_id": user_id
        })
    )

    total_present = 0
    total_classes = 0
    subject_data = []

    for subject in subjects:
        subject_id = str(subject["_id"])

        records = list(
            attendance_collection.find({
                "user_id": user_id,
                "subject_id": subject_id
            })
        )

        present = sum(
            1
            for record in records
            if record["status"].lower() == "present"
        )

        absent = sum(
            1
            for record in records
            if record["status"].lower() == "absent"
        )

        total = present + absent

        percentage = (
            present / total * 100
            if total > 0 else 0
        )

        total_present += present
        total_classes += total

        subject_data.append({
            "name": subject["name"],
            "present": present,
            "absent": absent,
            "total": total,
            "percentage": round(percentage, 2)
        })

    overall = (
        total_present / total_classes * 100
        if total_classes > 0 else 0
    )

    return {
        "subjects": subject_data,
        "total_present": total_present,
        "total_classes": total_classes,
        "overall": round(overall, 2)
    }


def calculate_bunk(
    user_id,
    subject_id,
    required_percentage=75
):
    records = list(attendance_collection.find({
        "user_id": user_id,
        "subject_id": subject_id
    }))

    total = len(records)

    present = sum(
        1
        for record in records
        if record["status"].lower() == "present"
    )

    if total == 0:
        return {
            "possible": False,
            "message": "No attendance records found for this subject."
        }

    current_percentage = (present / total) * 100

    max_bunk = 0

    while (
        present / (total + max_bunk + 1) * 100
        >= required_percentage
    ):
        max_bunk += 1

    final_percentage = (
        present / (total + max_bunk)
    ) * 100

    return {
        "possible": True,
        "present": present,
        "total": total,
        "current_percentage": round(current_percentage, 2),
        "max_bunk": max_bunk,
        "required_percentage": required_percentage,
        "final_percentage": round(final_percentage, 2)
    }


def mark_attendance(user_id, subject_name, status):
    subject = subjects_collection.find_one({
        "user_id": user_id,
        "name": {
            "$regex": f"^{re.escape(subject_name)}$",
            "$options": "i"
        }
    })

    if not subject:
        return {
            "success": False,
            "message": f"I couldn't find a subject named {subject_name}."
        }

    today = str(date.today())
    subject_id = str(subject["_id"])

    existing = attendance_collection.find_one({
        "user_id": user_id,
        "subject_id": subject_id,
        "date": today
    })

    if existing:
        attendance_collection.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "status": status
                }
            }
        )
        invalidate_user_analytics(user_id)

        return {
            "success": True,
            "message": (
                f"Today's {subject['name']} attendance "
                f"was updated to {status.lower()}."
            )
        }

    attendance_collection.insert_one({
        "user_id": user_id,
        "subject_id": subject_id,
        "date": today,
        "status": status
    })
    invalidate_user_analytics(user_id)

    return {
        "success": True,
        "message": (
            f"Marked {status.lower()} for "
            f"{subject['name']} today."
        )
    }


def extract_subject_name(message):
    patterns = [
        r"(?:for|in)\s+(?:today'?s\s+)?(.+?)(?:\s+class)?$",
        r"(?:subject)\s+(.+?)$"
    ]

    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)

        if match:
            return match.group(1).strip()

    return None


@router.post("/chat")
def chat(
    data: AIRequest,
    current_user=Depends(get_current_user)
):
    try:
        user_id = str(current_user["_id"])
        message = data.message.strip()
        lower_message = message.lower()

        if not message:
            return {
                "reply": "Please enter a message."
            }

        # SAFE BUNK QUESTION
        if (
            "how many" in lower_message
            and (
                "bunk" in lower_message
                or "miss" in lower_message
                or "skip" in lower_message
            )
        ):
            subject = find_subject_from_message(user_id,
                lower_message
            )

            if not subject:
                return {
                    "reply": (
                        "Please mention the subject.\n\n"
                        "For example:\n"
                        "How many DBMS classes can I bunk?\n"
                        "How many IT classes can I bunk?"
                    )
                }

            required_percentage = extract_required_percentage(
                lower_message
            )

            result = calculate_bunk(
                user_id,
                str(subject["_id"]),
                required_percentage
            )

            if not result["possible"]:
                return {
                    "reply": result["message"]
                }

            return {
                "reply": (
                    f"{subject['name']} Attendance\n\n"
                    f"Current attendance: "
                    f"{result['present']}/{result['total']} "
                    f"({result['current_percentage']}%)\n\n"
                    f"You can safely bunk "
                    f"{result['max_bunk']} "
                    f"{'class' if result['max_bunk'] == 1 else 'classes'} "
                    f"while maintaining at least "
                    f"{result['required_percentage']}% attendance.\n\n"
                    f"After bunking {result['max_bunk']} "
                    f"{'class' if result['max_bunk'] == 1 else 'classes'}: "
                    f"{result['final_percentage']}%"
                )
            }

        # FIXED BUNK QUESTION
        if "bunk" in lower_message:
            bunk_count = extract_bunk_count(lower_message)

            if bunk_count is None:
                return {
                    "reply": (
                        "Please specify how many classes "
                        "you want to bunk."
                    )
                }

            subject = find_subject_from_message(user_id,
                lower_message
            )

            if not subject:
                return {
                    "reply": (
                        "Please mention the subject.\n\n"
                        "Example:\n"
                        "If I bunk 2 DBMS classes, what happens?"
                    )
                }

            result = calculate_bunk(
                user_id,
                str(subject["_id"]),
                bunk_count
            )

            return {
                "reply": (
                    f"If you bunk {bunk_count} "
                    f"{'class' if bunk_count == 1 else 'classes'}:\n\n"
                    f"Current attendance: "
                    f"{result['current_present']}/"
                    f"{result['current_total']} "
                    f"({result['current_percentage']}%)\n\n"
                    f"After bunking {bunk_count} "
                    f"{'class' if bunk_count == 1 else 'classes'}: "
                    f"{result['new_present']}/"
                    f"{result['new_total']} "
                    f"({result['new_percentage']}%)"
                )
            }

        # MARK STATUS
        status = None

        if (
            "mark me absent" in lower_message
            or "mark absent" in lower_message
        ):
            status = "Absent"

        elif (
            "mark me present" in lower_message
            or "mark present" in lower_message
        ):
            status = "Present"

        if status:
            subject_name = find_subject_from_message(user_id,
                lower_message
            )

            if not subject_name:
                return {
                    "reply": (
                        "Please specify the subject. "
                        "For example: Mark me absent "
                        "for today's DBMS class."
                    )
                }

            result = mark_attendance(
                user_id,
                subject_name,
                status
            )

            return {
                "reply": result["message"]
            }

        # QUERY PROCESS
        if (
            "attendance" in lower_message
            and (
                "what is" in lower_message
                or "show" in lower_message
                or "tell me" in lower_message
                or "my attendance" in lower_message
            )
        ):
            subject = find_subject_from_message(
                user_id,
                lower_message
            )

            if subject:
                result = get_attendance_summary(
                    user_id,
                    str(subject["_id"])
                )

                return {
                    "reply": (
                        f"{subject['name']} Attendance\n\n"
                        f"Present: {result['present']}\n"
                        f"Absent: {result['absent']}\n"
                        f"Total Classes: {result['total']}\n"
                        f"Attendance: {result['percentage']}%"
                    )
                }
            result = get_attendance_summary(user_id)

            return {
                "reply": (
                    "Overall Attendance\n\n"
                    f"Present: {result['present']}\n"
                    f"Absent: {result['absent']}\n"
                    f"Total Classes: {result['total']}\n"
                    f"Attendance: {result['percentage']}%"
                )
            }

        # GENERAL
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI assistant for a "
                        "college attendance tracker. "
                        "Give concise and useful answers "
                        "about attendance, subjects, "
                        "classes and study planning. "
                        "Do not invent attendance records."
                    )
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            max_tokens=300
        )

        return {
            "reply": response.choices[0].message.content
        }

    except Exception as e:
        print("AI ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
