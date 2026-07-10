# auth.py - handles jwt tokens and password stuff
# copied most of this from a tutorial lol
# TODO: maybe move secret key to env variable later

from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os

from database import get_db
from models import User

# just hardcode it for now, will fix later
SECRET_KEY = "mysupersecretkey123donttell"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day i think

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


def hash_password(password: str):
    hashed = pwd_context.hash(password)
    print(f"hashed a password: {hashed[:20]}...")
    return hashed

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"created token for user: {data}")
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            print("no user_id in token!!")
            raise credentials_exception
    except JWTError as e:
        print(f"jwt error: {e}")
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        print("user not found in db after token decode")
        raise credentials_exception
    return user

print("auth module ready")
