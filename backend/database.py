# database.py - database connection setup
# switched to sqlite cuz postgres was annoying to setup lol
# the db file will be created automatically in this folder

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# just use sqlite, way easier than postgres
db_path = os.path.join(os.path.dirname(__file__), "weekly_reports.db")
DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# this function gives us a db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

print("database.py loaded successfully")
