from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from database import subjects_collection
from attservice import calculate_attendance
from depend import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def dashboard(current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    dashboard_data = []

    total_present = 0
    total_classes = 0

    for subject in subjects_collection.find({"user_id": str(current_user["_id"])}):
        data = calculate_attendance(str(subject["_id"]),current_user)

        dashboard_data.append(data)

        total_present += data["present"]
        total_classes += data["total_classes"]

    overall = 0

    if total_classes > 0:
        overall = round((total_present / total_classes) * 100, 2)

    return {
        "overall_attendance": overall,
        "subjects": dashboard_data
    }


