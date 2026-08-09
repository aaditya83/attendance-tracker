from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from bson import ObjectId
from database import users_collection
from security import SECRET_KEY, ALGORITHM

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    if credentials is None:
        print("NO AUTHORIZATION HEADER RECEIVED")
        raise HTTPException(
            status_code=401,
            detail="Missing authorization token"
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        user = users_collection.find_one(
            {"_id": ObjectId(user_id)}
        )

        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return user

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )