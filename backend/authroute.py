from fastapi import APIRouter, Depends,HTTPException
from database import users_collection
from models import userlogin, useregister
from security import hash_password, verify_password, create_access_token
from depend import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

def helper(user):
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"]
    }

@router.post("/register")
def register(user: useregister):
    existing_user = users_collection.find_one(
        {"email": user.email}
    )
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )
    new_user = {
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password)
    }
    result = users_collection.insert_one(new_user)
    created_user = users_collection.find_one(
        {"_id": result.inserted_id}
    )
    token = create_access_token(
        {
            "user_id": str(created_user["_id"]),
            "email": created_user["email"],
            "username": created_user["username"]
        }
    )
    return {
        "message": "User registered successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": helper(created_user)
    }


@router.post("/login")
def login_user(user: userlogin):
    existing_user = users_collection.find_one({
        "username": user.username
    })
    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    valid = verify_password(
        user.password,
        existing_user["password"]
    )
    if not valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    token = create_access_token({
        "user_id": str(existing_user["_id"]),
        "email": existing_user["email"],
        "username": existing_user["username"]
    })
    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": helper(existing_user)
    }

@router.get("/users")
def get_users():
    users = []
    userslist = users_collection.find()
    for user in userslist:
        users.append(helper(user))
    return users

@router.get("/me")
def me(current_user=Depends(get_current_user)):

    return {
        "id": str(current_user["_id"]),
        "name": current_user["username"],
        "email": current_user["email"]
    }