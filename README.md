# TaskFlow — Full-Stack DevOps Learning Project

TaskFlow is a task-management web application developed as part of the **SOFT806: Continuous Integration and Continuous Deployment** learning project. It combines a React frontend with a Django REST Framework backend and demonstrates source control, containerisation, automated testing, and CI/CD using GitHub Actions and CircleCI.

> **Project status:** A working learning/demo application. The repository is intended for local development and coursework demonstration, not production deployment.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Get the repository](#get-the-repository)
- [Run locally without Docker](#run-locally-without-docker)
  - [Start the backend](#1-start-the-django-backend)
  - [Start the frontend](#2-start-the-react-frontend)
- [Run with Docker Compose](#run-with-docker-compose)
- [API overview](#api-overview)
- [Run checks](#run-checks)
- [CI/CD workflow](#cicd-workflow)
- [Git contribution workflow](#git-contribution-workflow)
- [Troubleshooting](#troubleshooting)

## Features

- Register an account and log in or log out using session-based authentication.
- Create tasks with a title and optional description.
- View tasks belonging to the authenticated user.
- Edit task details.
- Mark tasks complete or incomplete.
- Delete tasks.
- View a profile summary and task counts.
- Use a React interface that communicates with the Django API.

## Technology stack

| Area | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Python, Django, Django REST Framework |
| Authentication | Django session authentication and CSRF protection |
| Database | SQLite for the development setup |
| Frontend package manager | npm |
| Backend package manager | pip |
| Containers | Docker, Docker Compose |
| Source control | Git and GitHub |
| CI | GitHub Actions and CircleCI |
| API testing | Thunder Client (used during development) |

## Architecture

The browser loads the React/Vite application. The frontend sends API requests to the Django REST Framework service. Django handles authentication and task operations, with SQLite storing development data.

```text
Browser
  |
  | React / Vite
  | localhost:5173 (local) or localhost:5174 (Compose)
  |
  | HTTP API requests
  v
Django REST Framework
  | localhost:8000
  |
  v
SQLite database
```

## Prerequisites

For local development without Docker, install:

- Git
- Python 3.13 (or a compatible Python version for the pinned Django dependencies)
- Node.js 24 and npm
- A terminal (PowerShell, Command Prompt, macOS Terminal, or Linux shell)

For the container workflow, install Docker Desktop (Windows/macOS) or Docker Engine with the Docker Compose plugin (Linux).

## Get the repository

### Clone with Git

Open a terminal and run:

```bash
git clone https://github.com/2ndjoy/devops-taskflow.git
cd devops-taskflow
```

To download without Git, open the [GitHub repository](https://github.com/2ndjoy/devops-taskflow), select **Code → Download ZIP**, extract the ZIP file, and open a terminal in the extracted `devops-taskflow` directory.

## Run locally without Docker

Run the backend and frontend in **two separate terminals**. Keep both terminals running while using the app.

### 1. Start the Django backend

From the repository root:

#### Windows PowerShell

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver
```

If the virtual environment already exists, you can activate it in PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use the explicit `.venv\Scripts\python.exe` commands above or activate from Command Prompt instead.

#### macOS / Linux

```bash
cd backend
python3.13 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API should be available at `http://127.0.0.1:8000/`. The task collection endpoint is:

```text
http://127.0.0.1:8000/api/tasks/
```

### 2. Start the React frontend

Open a **second terminal** at the repository root.

```bash
cd frontend
npm ci
```

Create a local environment file named `.env` in the `frontend` directory with these development values:

```dotenv
VITE_API_URL=http://localhost:8000/api/tasks/
VITE_AUTH_URL=http://localhost:8000/api/auth/
```

Then start Vite:

```bash
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`.

> The frontend environment variables are used by Vite. Restart the Vite development server after changing `.env`.

## Run with Docker Compose

Docker Compose builds the frontend and backend images and starts both services. From the repository root, make sure Docker is running, then execute:

```bash
docker compose up --build
```

Open the frontend at:

```text
http://localhost:5174
```

The backend is exposed at:

```text
http://localhost:8000
```

To run the containers in the background:

```bash
docker compose up --build -d
```

View service status and logs:

```bash
docker compose ps
docker compose logs -f
```

Stop the services:

```bash
docker compose down
```

To also remove the named database volume and its persisted data (this is destructive):

```bash
docker compose down -v
```

**Compose note:** The current Compose configuration maps the frontend to port `5174` on the host and the Vite service to port `5173` in the container. The backend uses SQLite and mounts the named `taskflow_db` volume at `/app/data`. Do not run the destructive volume command if you want to keep data stored in that volume.

## API overview

The main API routes configured in the backend are:

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/tasks/` | List the authenticated user's tasks |
| POST | `/api/tasks/` | Create a task |
| GET | `/api/tasks/<id>/` | Retrieve a task |
| PATCH | `/api/tasks/<id>/` | Update task fields, including completion |
| DELETE | `/api/tasks/<id>/` | Delete a task |
| — | `/api/auth/` | Authentication routes (registration, login, logout, CSRF/session endpoints) |

Task endpoints require an authenticated session. The frontend includes credentials and obtains a CSRF token for state-changing requests.

## Run checks

### Backend tests

From the repository root:

```bash
cd backend
python manage.py test tasks
```

If using the virtual environment, run the command with that environment activated.

### Frontend lint and production build

From the repository root:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

A successful `npm run build` creates the production frontend output in `frontend/dist`.

## CI/CD workflow

TaskFlow uses **GitHub Actions and CircleCI** to demonstrate continuous integration and Docker image delivery.

The configured pipeline activities include:

- Running backend tests.
- Checking and building the frontend.
- Building the backend and frontend Docker images.
- Publishing Docker images through the configured Docker publishing workflow.

The repository contains the CI configuration files. Review the GitHub Actions workflow under `.github/workflows/` and the CircleCI configuration under `.circleci/` for the exact triggers, job dependencies, and image tags.

CI status and job logs are available from the repository's **Actions** tab on GitHub and the project's CircleCI dashboard.

## Git contribution workflow

TaskFlow uses a feature-branch and Pull Request workflow:

1. Update the local `main` branch.
2. Create a feature branch for a change.
3. Make and test the change locally.
4. Commit the change with a clear message.
5. Push the branch to GitHub.
6. Open a Pull Request targeting `main`.
7. Review the changes and discuss or comment as appropriate.
8. Confirm the relevant CI checks pass.
9. Merge the Pull Request.

Example commands:

```bash
git switch main
git pull origin main
git switch -c feature/describe-your-change

# Make changes, then check them
git status
git diff

git add .
git commit -m "Describe the change"
git push -u origin feature/describe-your-change
```

Create the Pull Request from the GitHub repository page. Replace `feature/describe-your-change` with the name of your actual branch.

## Troubleshooting

### Port is already in use

If port `8000`, `5173`, or `5174` is occupied, stop the other process or adjust the relevant port mapping/configuration. Ensure the frontend API URL still points to the backend address reachable from the browser.

### Frontend cannot reach the backend

- Confirm the Django server is running.
- Open `http://127.0.0.1:8000/api/tasks/` in the browser.
- Check `frontend/.env` and confirm `VITE_API_URL` and `VITE_AUTH_URL` use the expected local addresses.
- Restart Vite after changing the environment file.
- For Docker Compose, use the host-facing API URL configured for the browser; `localhost` inside a container refers to that container itself.

### Login or state-changing requests fail

The application uses session authentication and CSRF protection. Ensure cookies are enabled, use the same host consistently (for example, `localhost` for the frontend API settings), and check the backend logs for CSRF or authentication errors.

### Docker build fails

- Confirm Docker Desktop/Engine is running.
- Run `docker compose build --no-cache` to rebuild images.
- Review output from `docker compose logs`.
- Confirm the required Dockerfiles and package files are present in `backend/` and `frontend/`.

## Learning purpose

This repository is a practical learning project for applying Agile planning, Git workflows, full-stack development, package management, Docker-based environments, automated testing, and CI/CD pipeline concepts as part of SOFT806.
