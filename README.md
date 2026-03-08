# Elevanda Platform — School Management System

A full-stack school management platform with a **Client Application** (parents/students) and an **Admin/Management Application** (staff/admin). Built with Django REST Framework on the backend and Next.js on the frontend.

---

## Repository Structure

```
elevanda-platform/
├── backend/
│   └── elevanda/
│       ├── api/                  # Central API layer (views, serializers, urls)
│       ├── users/                # Custom user model & device verification
│       ├── academics/            # Classes, subjects, grades, attendance, timetable
│       ├── fees/                 # Fee accounts & transactions
│       ├── school/               # Student & teacher profiles
│       ├── elevanda/             # Django project settings & urls
│       ├── manage.py
│       └── requirements.txt
└── frontend/
    └── src/
        └── app/
            ├── (auth)/           # Login & Register pages
            ├── (dashboard)/      # Protected dashboard routes
            ├── SharedComponents/ # Reusable UI components
            ├── hooks/            # React data hooks
            ├── services/         # API service layer
            ├── store/            # Zustand auth store
            └── utils/            # Types, helpers, formatters
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python + Django 6 | Core framework |
| Django REST Framework | REST API |
| djangorestframework-simplejwt | JWT authentication |
| drf-spectacular | Auto OpenAPI/Swagger docs |
| django-cors-headers | CORS handling |
| django-filter | Query filtering |
| SQLite (dev) | Database |
| python-dotenv | Environment variable loading |

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Axios | HTTP client |
| Zustand | Auth state management |
| js-cookie | JWT cookie storage |
| react-hot-toast | Toast notifications |
| lucide-react | Icons |

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

---

## Backend Setup

### 1. Navigate to the backend directory

```bash
cd backend/elevanda
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create your environment file

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=1
```

### 5. Apply migrations

```bash
python manage.py migrate
```

### 6. Create a superuser (admin account)

```bash
python manage.py createsuperuser
```

Enter your email and password when prompted. The password will be automatically SHA-512 hashed before storage.

### 7. Start the backend server

```bash
python manage.py runserver
```

The API will be available at: `http://127.0.0.1:8000`

---

## Frontend Setup

### 1. Navigate to the frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

### 4. Start the development server

```bash
npm run dev
```

The frontend will be available at: `http://localhost:3000`

---

## Running Both Together

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend/elevanda
source venv/bin/activate
python manage.py runserver
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

---

## Authentication Flow

### Password Security
All passwords are **SHA-512 hashed on the frontend** before being sent to the backend. The backend wraps the SHA-512 hash with Django's PBKDF2 hasher for storage. The `User.check_password()` method is overridden to detect pre-hashed values (128-char hex strings) and handle both frontend login calls and Django admin panel logins correctly.

### Device Verification Flow
1. User registers → device is created with status `pending`
2. Admin approves the device via the admin panel or API
3. User logs in → device status is checked
4. Only `approved` devices receive JWT tokens
5. Admin users bypass device verification entirely

### JWT Tokens
- **Access token** — stored in a cookie, expires in 60 minutes (configurable)
- **Refresh token** — stored in a cookie, expires in 1 day (configurable)
- The Axios client automatically retries failed requests after refreshing the access token
- On refresh failure, the user is redirected to `/login`

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Register new user |
| `POST` | `/api/auth/login/` | Login and receive JWT tokens |
| `POST` | `/api/auth/logout/` | Blacklist refresh token |
| `POST` | `/api/auth/token/refresh/` | Refresh access token |

### Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/` | List all users (filterable by `?role=`) |
| `GET` | `/api/users/{id}/` | Get user details |
| `GET` | `/api/users/me/` | Get current authenticated user |
| `PATCH` | `/api/users/{id}/toggle-active/` | Activate or deactivate user |

### Device Verification
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/devices/` | List device requests (filterable by `?status=`) |
| `GET` | `/api/devices/{id}/` | Get device details |
| `POST` | `/api/devices/{id}/approve/` | Approve a device |
| `POST` | `/api/devices/{id}/reject/` | Reject a device |

### Fees
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/fee-accounts/` | List fee accounts |
| `GET` | `/api/fee-accounts/{id}/` | Get account details |
| `POST` | `/api/fee-accounts/{id}/deposit/` | Record a fee payment |
| `POST` | `/api/fee-accounts/{id}/withdraw/` | Request a refund |

### Academics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/grades/` | List grades |
| `POST` | `/api/grades/` | Create grade entry |
| `GET` | `/api/attendance/` | List attendance records |
| `POST` | `/api/attendance/` | Create attendance record |
| `GET` | `/api/timetable/` | List timetable entries |
| `POST` | `/api/timetable/` | Create timetable entry |

### Classes & Profiles
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/classes/` | List or create classes |
| `GET` | `/api/classes/{id}/timetable/` | Get timetable for a class |
| `GET` | `/api/classes/{id}/students/` | Get students in a class |
| `GET/POST` | `/api/student-profiles/` | List or create student profiles |
| `GET/POST` | `/api/teacher-profiles/` | List or create teacher profiles |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats/` | Admin dashboard statistics |

---

## API Documentation (Swagger)

Once the backend is running, interactive API docs are available at:

- **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
- **ReDoc:** `http://127.0.0.1:8000/api/redoc/`
- **OpenAPI Schema:** `http://127.0.0.1:8000/api/schema/`

Use the **Authorize** button in Swagger UI and enter your Bearer token to test protected endpoints:
```
Bearer <your_access_token>
```

---

## Django Admin Panel

The Django admin panel is available at:

```
http://127.0.0.1:8000/admin/
```

Log in with the superuser credentials you created. From here you can:
- View and manage all users
- Approve or reject device verification requests
- Manage classes, grades, and attendance records
- View fee accounts and transactions

---

## Role-Based Access

| Role | Capabilities |
|---|---|
| `admin` | Full access, bypasses device verification |
| `teacher` | Update grades and attendance |
| `student` | View own grades, attendance, timetable, and fee balance |
| `parent` | View child's grades, attendance, timetable, and fee balance |

> **Note:** Self-registration as `admin` is blocked at the API level. Admin accounts must be created via `python manage.py createsuperuser` or the Django admin panel.

---

## Environment Variables Reference

### Backend (`.env`)

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | — | Django secret key (required in production) |
| `DEBUG` | `True` | Set to `False` in production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated list of allowed hosts |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Comma-separated allowed frontend origins |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | `60` | Access token expiry in minutes |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `1` | Refresh token expiry in days |

### Frontend (`.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000/api` | Backend API base URL |

---

## Project Assumptions

- SQLite is used for development. For production, switch to PostgreSQL by updating `DATABASES` in `settings.py`.
- The frontend sends passwords pre-hashed with SHA-512 using the Web Crypto API (`crypto.subtle.digest`). The backend validates that the received password is a valid 128-character hex string before storing it.
- Device verification is mandatory for all non-admin users before a JWT token is issued.
- Fee deposits are immediately approved. Withdrawal requests are also immediately processed if the balance is sufficient.
- The `FeeAccount` for a student must be created manually (via admin or API) after the student profile is set up.
- Rate limiting is applied: 100 requests/minute for anonymous users, 200 requests/minute for authenticated users.
