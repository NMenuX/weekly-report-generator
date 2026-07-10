# Weekly Report Generator & Team Dashboard

This is my submission for the technical assignment. It is a full stack web application where team members can submit weekly reports and managers can view all reports in a dashboard with charts and statistics.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, Axios, Recharts
- **Backend:** Python, FastAPI, SQLAlchemy ORM, JWT Authentication, Passlib
- **Database:** SQLite

## How to Setup & Run

### Prerequisites
- Node.js installed
- Python 3.10+ installed
- PostgreSQL installed and running

### 1. Database Setup

The app uses **SQLite** for simplicity and easy grading.
Zero setup is required! The database file (`weekly_reports.db`) is automatically created in the `backend/` folder when you start the server.

### 2. Backend Setup

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The server will start on http://localhost:8000
Tables and default projects are created automatically on startup.

### 3. Frontend Setup

```
cd frontend
npm install
npm run dev
```

The app will open on http://localhost:5173

## Features

### Team Member
- Register and login
- Submit weekly reports (tasks completed, planned, blockers, hours, notes)
- Select project for each report
- View past report history
- Edit reports before final submission

### Manager / Admin
- View all team member reports
- Dashboard with summary cards (total reports, pending, team size)
- Bar chart showing hours worked per team member
- Pie chart showing reports per project
- Filter reports by employee, project, or status
- Manage projects (add/delete)
- View team member list

## ER Diagram

The database has 3 tables:

**users**
- id (PK), name, email (unique), password (hashed), role, created_at

**projects**
- id (PK), name, description

**reports**
- id (PK), week_start, week_end, tasks_completed, tasks_planned, blockers, hours_worked, notes, status, user_id (FK -> users), project_id (FK -> projects)

## Architecture

```
React Frontend (port 5173)
    ↓ (HTTP/REST + JWT)
FastAPI Backend (port 8000)
    ↓ (SQLAlchemy ORM)
PostgreSQL Database
```

## Notes
- JWT tokens are used for authentication
- Passwords are hashed using bcrypt via Passlib
- Role-based access control (RBAC) is implemented - Members and Admins have different dashboards and permissions
- CORS is enabled for frontend-backend communication
- I didnt implement the optional AI Chat feature due to time constraints
