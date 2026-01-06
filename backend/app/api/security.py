from datetime import datetime, timedelta
from typing import Optional, Union
from jose import jwt
from passlib.context import CryptContext
import logging

logger = logging.getLogger(__name__)

# SECRET_KEY should be loaded from env in production
SECRET_KEY = "CHANGE_THIS_IN_PRODUCTION_SECRET_KEY_vantage_search"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if len(plain_password) > 72:
        plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_video_access_token(video_id: str) -> str:
    """Create a short-lived token specifically for accessing a video"""
    expire = datetime.utcnow() + timedelta(minutes=5) # 5 minutes validity
    to_encode = {
        "sub": "video_access",
        "video_id": video_id,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_video_access_token(token: str, video_id: str) -> bool:
    """Verify if a token grants access to a specific video"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") != "video_access":
            return False
        if payload.get("video_id") != video_id:
            return False
        return True
    except jwt.JWTError:
        return False
