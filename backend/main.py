# main.py - the main fastapi app
# weekly report generator backend
# created by intern, pls dont judge
# run with: uvicorn main:app --reload

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime, timedelta
import uvicorn
import os

from database import engine, get_db, Base
from models import User, Project, Report
from auth import hash_password, verify_password, create_access_token, get_current_user

app = FastAPI(title="Weekly Report Generator", version="0.1.0")

# cors stuff - just allow everything for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- pydantic schemas ----

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "member"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    week_start: date
    week_end: date
    tasks_completed: Optional[str] = ""
    tasks_planned: Optional[str] = ""
    blockers: Optional[str] = ""
    hours_worked: Optional[float] = 0.0
    notes: Optional[str] = ""
    links: Optional[str] = ""
    status: Optional[str] = "draft"
    project_id: int

class ReportUpdate(BaseModel):
    week_start: Optional[date] = None
    week_end: Optional[date] = None
    tasks_completed: Optional[str] = None
    tasks_planned: Optional[str] = None
    blockers: Optional[str] = None
    hours_worked: Optional[float] = None
    notes: Optional[str] = None
    links: Optional[str] = None
    status: Optional[str] = None
    project_id: Optional[int] = None

class ReportOut(BaseModel):
    id: int
    week_start: date
    week_end: date
    tasks_completed: Optional[str]
    tasks_planned: Optional[str]
    blockers: Optional[str]
    hours_worked: Optional[float]
    notes: Optional[str]
    links: Optional[str]
    status: str
    user_id: int
    project_id: int
    user: Optional[UserOut] = None
    project: Optional[ProjectOut] = None

    class Config:
        from_attributes = True


def get_current_week_start():
    today = date.today()
    return today - timedelta(days=today.weekday())


def get_current_week_end():
    return get_current_week_start() + timedelta(days=4)


def report_to_out(report, user=None, project=None):
    return ReportOut(
        id=report.id,
        week_start=report.week_start,
        week_end=report.week_end,
        tasks_completed=report.tasks_completed,
        tasks_planned=report.tasks_planned,
        blockers=report.blockers,
        hours_worked=report.hours_worked,
        notes=report.notes,
        links=report.links,
        status=report.status,
        user_id=report.user_id,
        project_id=report.project_id,
        user=UserOut(
            id=user.id, name=user.name, email=user.email,
            role=user.role, created_at=user.created_at
        ) if user else (UserOut(
            id=report.user.id, name=report.user.name, email=report.user.email,
            role=report.user.role, created_at=report.user.created_at
        ) if report.user else None),
        project=ProjectOut(
            id=project.id, name=project.name, description=project.description
        ) if project else (ProjectOut(
            id=report.project.id, name=report.project.name,
            description=report.project.description
        ) if report.project else None),
    )


def get_member_submission_status(members, reports, week_start, week_end):
    today = date.today()
    statuses = []
    for member in members:
        member_reports = [
            r for r in reports
            if r.user_id == member.id and r.week_start == week_start and r.week_end == week_end
        ]
        submitted = next((r for r in member_reports if r.status == "submitted"), None)
        if submitted:
            status = "submitted"
        elif today > week_end:
            status = "late"
        else:
            status = "pending"
        statuses.append({
            "name": member.name,
            "user_id": member.id,
            "status": status,
        })
    return statuses


# ---- startup event ----

@app.on_event("startup")
def on_startup():
    print("creating tables...")
    Base.metadata.create_all(bind=engine)
    print("tables created!")

    # add links column if upgrading from older db
    from sqlalchemy import text
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE reports ADD COLUMN links TEXT"))
            conn.commit()
            print("added links column to reports table")
        except Exception:
            pass

    # seed default projects if none exist
    from database import SessionLocal
    db = SessionLocal()
    try:
        count = db.query(Project).count()
        if count == 0:
            print("seeding default projects...")
            default_projects = [
                Project(name="Website Redesign", description="Redesigning the company website with new UI/UX"),
                Project(name="Mobile App", description="Building the mobile app for iOS and Android"),
                Project(name="API Development", description="Backend API services and integrations"),
                Project(name="DevOps", description="CI/CD pipeline and infrastructure stuff"),
                Project(name="Internal Tools", description="Various internal tools and scripts"),
            ]
            for p in default_projects:
                db.add(p)
            db.commit()
            print(f"seeded {len(default_projects)} projects")
        else:
            print(f"already have {count} projects, skipping seed")
    except Exception as e:
        print(f"error seeding: {e}")
        db.rollback()
    
    # seed default admin and member accounts if no users exist
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("seeding default users...")
            admin = User(
                name="Admin User",
                email="admin@company.com",
                password=hash_password("admin123"),
                role="admin",
            )
            member = User(
                name="John Member",
                email="john@company.com",
                password=hash_password("member123"),
                role="member",
            )
            db.add(admin)
            db.add(member)
            db.commit()
            print("seeded admin and member accounts")
        else:
            print(f"already have {user_count} users, skipping user seed")
    except Exception as e:
        print(f"error seeding users: {e}")
        db.rollback()
    finally:
        db.close()


# ---- auth endpoints ----

@app.post("/api/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    print(f"register attempt: {user_data.email}")
    
    # check if email already exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        print(f"email already taken: {user_data.email}")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # validate role
    if user_data.role not in ["member", "admin"]:
        raise HTTPException(status_code=400, detail="Role must be member or admin")
    
    hashed_pw = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_pw,
        role=user_data.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"registered user: {new_user.name} (id={new_user.id})")
    
    # auto login after register, give them a token
    token = create_access_token({"user_id": new_user.id, "email": new_user.email, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
        }
    }


@app.post("/api/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    print(f"login attempt: {login_data.email}")
    
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        print(f"user not found: {login_data.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(login_data.password, user.password):
        print(f"wrong password for: {login_data.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"user_id": user.id, "email": user.email, "role": user.role})
    print(f"login success: {user.email}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        }
    }


@app.get("/api/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    print(f"fetching /me for user {current_user.id}")
    return current_user


# ---- project endpoints ----

@app.get("/api/projects", response_model=List[ProjectOut])
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.query(Project).all()
    print(f"returning {len(projects)} projects")
    return projects


@app.post("/api/projects", response_model=ProjectOut)
def create_project(project_data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # only admins can create projects
    if current_user.role != "admin":
        print(f"user {current_user.id} tried to create project but is not admin")
        raise HTTPException(status_code=403, detail="Only admins can create projects")
    
    new_project = Project(
        name=project_data.name,
        description=project_data.description
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    print(f"created project: {new_project.name} (id={new_project.id})")
    return new_project


@app.put("/api/projects/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, project_data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can edit projects")
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.name = project_data.name
    project.description = project_data.description
    db.commit()
    db.refresh(project)
    print(f"updated project: {project.id}")
    return project

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete projects")
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    print(f"deleted project: {project_id}")
    return {"message": "Project deleted successfully"}


# ---- report endpoints ----

@app.get("/api/reports", response_model=List[ReportOut])
def get_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        reports = db.query(Report).all()
        print(f"admin fetching all reports, got {len(reports)}")
    else:
        reports = db.query(Report).filter(Report.user_id == current_user.id).all()
        print(f"member {current_user.id} fetching own reports, got {len(reports)}")

    reports.sort(key=lambda r: (r.week_start, r.id), reverse=True)
    return [report_to_out(r) for r in reports]


@app.get("/api/reports/my", response_model=List[ReportOut])
def get_my_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reports = db.query(Report).filter(Report.user_id == current_user.id).all()
    reports.sort(key=lambda r: (r.week_start, r.id), reverse=True)
    print(f"member {current_user.id} fetching my reports, got {len(reports)}")
    return [report_to_out(r) for r in reports]


@app.get("/api/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this report")
    return report_to_out(report)


@app.post("/api/reports", response_model=ReportOut)
def create_report(report_data: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    print(f"creating report for user {current_user.id}")
    
    # check project exists
    project = db.query(Project).filter(Project.id == report_data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_report = Report(
        week_start=report_data.week_start,
        week_end=report_data.week_end,
        tasks_completed=report_data.tasks_completed,
        tasks_planned=report_data.tasks_planned,
        blockers=report_data.blockers,
        hours_worked=report_data.hours_worked,
        notes=report_data.notes,
        links=report_data.links,
        status=report_data.status,
        user_id=current_user.id,
        project_id=report_data.project_id,
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    print(f"report created with id {new_report.id}")

    return report_to_out(new_report, user=current_user, project=project)


@app.put("/api/reports/{report_id}", response_model=ReportOut)
def update_report(report_id: int, report_data: ReportUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    print(f"updating report {report_id}")
    
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # check if user owns the report or is admin
    if report.user_id != current_user.id and current_user.role != "admin":
        print(f"user {current_user.id} tried to edit report {report_id} but doesnt own it")
        raise HTTPException(status_code=403, detail="You can only edit your own reports")
    
    # update fields that were provided
    if report_data.week_start is not None:
        report.week_start = report_data.week_start
    if report_data.week_end is not None:
        report.week_end = report_data.week_end
    if report_data.tasks_completed is not None:
        report.tasks_completed = report_data.tasks_completed
    if report_data.tasks_planned is not None:
        report.tasks_planned = report_data.tasks_planned
    if report_data.blockers is not None:
        report.blockers = report_data.blockers
    if report_data.hours_worked is not None:
        report.hours_worked = report_data.hours_worked
    if report_data.notes is not None:
        report.notes = report_data.notes
    if report_data.links is not None:
        report.links = report_data.links
    if report_data.status is not None:
        report.status = report_data.status
    if report_data.project_id is not None:
        # make sure the project exists
        proj = db.query(Project).filter(Project.id == report_data.project_id).first()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")
        report.project_id = report_data.project_id
    
    db.commit()
    db.refresh(report)
    print(f"report {report_id} updated")

    user = db.query(User).filter(User.id == report.user_id).first()
    project = db.query(Project).filter(Project.id == report.project_id).first()
    return report_to_out(report, user=user, project=project)

@app.delete("/api/reports/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this report")
    
    if report.status != "draft" and current_user.role != "admin":
        raise HTTPException(status_code=400, detail="Cannot delete submitted report")
    
    db.delete(report)
    db.commit()
    print(f"deleted report {report_id}")
    return {"message": "Report deleted successfully"}

# ---- team endpoint ----

@app.get("/api/team", response_model=List[UserOut])
def get_team(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view team members")
    
    users = db.query(User).all()
    print(f"returning {len(users)} team members")
    return users


# health check just in case
@app.get("/api/health")
def health():
    return {"status": "ok", "message": "server is running"}


# ---- dashboard stats for admin ----
# this is the new endpoint for day 3
# returns all the numbers the admin dashboard needs

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    week_start: Optional[date] = None,
    week_end: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view dashboard stats")

    if not week_start:
        week_start = get_current_week_start()
    if not week_end:
        week_end = get_current_week_end()

    all_reports = db.query(Report).all()
    all_users = db.query(User).filter(User.role == "member").all()
    all_projects = db.query(Project).all()

    total_reports = len(all_reports)
    submitted_reports = len([r for r in all_reports if r.status == "submitted"])
    draft_reports = len([r for r in all_reports if r.status == "draft"])

    reports_this_week = [
        r for r in all_reports
        if r.status == "submitted" and r.week_start == week_start and r.week_end == week_end
    ]

    users_who_submitted = set()
    for r in all_reports:
        if r.status == "submitted":
            users_who_submitted.add(r.user_id)

    total_members = len(all_users)
    compliance = 0
    if total_members > 0:
        compliance = round((len(users_who_submitted) / total_members) * 100)

    open_blockers = 0
    for r in all_reports:
        if r.blockers and r.blockers.strip() and r.status == "submitted":
            open_blockers += 1

    weekly_data = {}
    for r in all_reports:
        if r.status == "submitted":
            week_key = str(r.week_start) if r.week_start else "unknown"
            weekly_data[week_key] = weekly_data.get(week_key, 0) + 1

    trend = [{"week": wk, "count": weekly_data[wk]} for wk in sorted(weekly_data.keys())]

    tasks_trend_data = {}
    for r in all_reports:
        if r.status == "submitted" and r.tasks_completed and r.tasks_completed.strip():
            week_key = str(r.week_start) if r.week_start else "unknown"
            task_count = len([line for line in r.tasks_completed.split("\n") if line.strip()])
            tasks_trend_data[week_key] = tasks_trend_data.get(week_key, 0) + task_count

    tasks_trend = [{"week": wk, "count": tasks_trend_data[wk]} for wk in sorted(tasks_trend_data.keys())]

    hours_by_user = {}
    for r in all_reports:
        uname = r.user.name if r.user else "Unknown"
        hrs = r.hours_worked or 0
        hours_by_user[uname] = hours_by_user.get(uname, 0) + hrs

    workload = [{"name": name, "hours": hrs} for name, hrs in hours_by_user.items()]

    project_dist = {}
    for r in all_reports:
        pname = r.project.name if r.project else "Uncategorized"
        project_dist[pname] = project_dist.get(pname, 0) + 1

    proj_chart = [{"name": name, "value": cnt} for name, cnt in project_dist.items()]

    member_status = get_member_submission_status(all_users, all_reports, week_start, week_end)
    submitted_count = len([m for m in member_status if m["status"] == "submitted"])
    pending_count = len([m for m in member_status if m["status"] == "pending"])
    late_count = len([m for m in member_status if m["status"] == "late"])

    print(f"dashboard stats: {total_reports} reports, {len(reports_this_week)} this week, {compliance}% compliance")

    return {
        "week_start": str(week_start),
        "week_end": str(week_end),
        "total_reports": total_reports,
        "reports_this_week": len(reports_this_week),
        "submitted_reports": submitted_reports,
        "draft_reports": draft_reports,
        "total_members": total_members,
        "submitted_count": submitted_count,
        "pending_count": pending_count,
        "late_count": late_count,
        "compliance": compliance,
        "open_blockers": open_blockers,
        "active_projects": len(all_projects),
        "submission_trend": trend,
        "tasks_completed_trend": tasks_trend,
        "member_submission_status": member_status,
        "workload": workload,
        "project_distribution": proj_chart,
    }


# alias so frontend can call /api/users too
@app.get("/api/users", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view users")
    users = db.query(User).all()
    print(f"returning {len(users)} users via /api/users")
    return users


if __name__ == "__main__":
    print("starting server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
