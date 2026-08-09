from pydantic import BaseModel, Field

class Subject(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    faculty: str = Field(..., min_length=2, max_length=100)
    required_attendance: int = Field(default=75, ge=1, le=100)

class attendance(BaseModel):
    subject_id: str
    date: str
    status: str = Field(..., min_length=1)

class timetable(BaseModel):
    subject_id: str
    day: str = Field(..., min_length=1,pattern="^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$")
    start_time: str = Field(..., min_length=1)
    end_time: str = Field(..., min_length=1)

class useregister(BaseModel):
    username: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    email: str = Field(..., min_length=5, max_length=100)

class userlogin(BaseModel):
    username: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)

class profile(BaseModel):
    username: str= Field(..., min_length=2, max_length=100)
    email: str= Field(..., min_length=5, max_length=100)

class ChangePassword(BaseModel):
    old_password: str= Field(..., min_length=2, max_length=100)
    new_password: str= Field(..., min_length=2, max_length=100)