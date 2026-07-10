# models.py - all the database models go here
# User, Project, Report tables
# i think this is how you do relationships in sqlalchemy

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import json

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="member")  # member or admin
    created_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship("Report", back_populates="user")

    def __repr__(self):
        return f"<User {self.name}>"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    reports = relationship("Report", back_populates="project")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    tasks_completed = Column(Text, nullable=True)
    tasks_planned = Column(Text, nullable=True)
    blockers = Column(Text, nullable=True)
    hours_worked = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    links = Column(Text, nullable=True)
    status = Column(String(20), default="draft")  # draft, submitted, late
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    user = relationship("User", back_populates="reports")
    project = relationship("Project", back_populates="reports")

print("models loaded ok")
