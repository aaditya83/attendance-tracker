from datetime import datetime, timedelta, UTC
import os
from jose import jwt
from pwdlib import PasswordHash
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

password_hash = PasswordHash.recommended()


def hash_password(password: str):

    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str):

    return password_hash.verify(password, hashed_password)


def create_access_token(data: dict):

    payload = data.copy()

    expire = datetime.now(UTC) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload.update(
        {
            "exp": expire
        }
    )

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token
