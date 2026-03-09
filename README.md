# Elevanda Platform — School Management System

A full-stack school management platform built with Django REST Framework (backend) and Next.js (frontend). This repository serves as a mono-repo containing both the Client Application (parents/students) and the Admin/Management interface.

---

## Technology Justification

The specification recommends Node.js/Express.js for the backend. Django REST Framework was chosen instead for the following reasons:

- Built-in ORM with migration management reduces boilerplate for complex relational data (users, classes, grades, fees)
- `djangorestframework-simplejwt` provides production-ready JWT with token blacklisting out of the box
- `drf-spectacular` auto-generates OpenAPI/Swagger documentation with zero extra code
- Django's custom user model makes SHA-512 password integration clean and testable
- Rate limiting, CORS, and security headers are available as first-party or well-maintained packages

The mono-repo structure was chosen for simplicity during the development window. In production these would be split into two separate deployments.

---

## Repository Structure

```
elevanda-platform/
├── backend/
│   └── elevanda/
│       ├── api/                      # Central API — views, serializers, urls
│       │   ├── views.py              # All endpoint logic
│       │   ├── serializers.py        # DTOs — controls data exposed to frontend
│       │   └── urls.py               # URL routing
│       ├── users/                    # Custom user model & device verification
│       │   └── models.py
│       ├── academics/                # Classes, subjects, grades, attendance, timetable
│       │   └── models.py
│       ├── fees/                     # Fee accounts & transactions
│       │   └── models.py
│       ├── school/                   # Student & teacher profiles
│       │   └── models.py
│       ├── elevanda/                 # Django project config
│       │   ├── settings.py
│       │   └── urls.py
│       ├── manage.py
│       ├── requirements.txt
│       └── .env.example
└── frontend/
    └── src/
        └── app/
            ├── (auth)/               # Login & Register pages
            │   ├── login/
            │   └── register/
            ├── (dashboard)/          # Protected client dashboard
            ├── SharedComponents/     # Reusable UI components
            │   ├── dashboard/
            │   ├── layout/
            │   └── ui/
            ├── hooks/                # React data hooks
            │   ├── useAuth.ts
            │   ├── useFees.ts
            │   ├── useGrades.ts
            │   ├── useAttendance.ts
            │   └── useTimetable.ts
            ├── services/             # API service layer
            │   ├── api.ts
            │   ├── auth.service.ts
            │   ├── fees.service.ts
            │   ├── grades.service.ts
            │   ├── attendance.service.ts
            │   └── timetable.service.ts
            ├── store/                # Zustand auth store
            └── utils/                # Types, helpers, formatters
    ├── .env.example
    └── package.json
```

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python + Django | 6.0.3 | Core framework |
| Django REST Framework | 3.16.1 | REST API layer |
| djangorestframework-simplejwt | 5.5.1 | JWT authentication & token blacklisting |
| drf-spectacular | 0.29.0 | Auto OpenAPI/Swagger documentation |
| django-cors-headers | 4.9.0 | CORS handling |
| django-filter | 25.2 | Query filtering |
| python-dotenv | 1.2.2 | Environment variable loading |
| SQLite | — | Development database |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js (App Router) | 15 | React framework |
| TypeScript | — | Type safety |
| Tailwind CSS | — | Styling |
| Axios | — | HTTP client with interceptors |
| Zustand | — | Auth state management |
| js-cookie | — | JWT cookie storage |
| react-hot-toast | — | Toast notifications |
| lucide-react | — | Icon library |

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

Edit `.env`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
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

Enter your email and password when prompted. The password is automatically SHA-512 hashed before storage via `create_superuser` in `UserManager`.

### 7. Start the backend server

```bash
python manage.py runserver
```

API available at: `http://127.0.0.1:8000`

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

Frontend available at: `http://localhost:3000`

---

## Running Both Together

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

## Authentication & Security

### Password Hashing (SHA-512)
Passwords are SHA-512 hashed **on the frontend** using the native Web Crypto API before transmission:

```typescript
const hashBuffer = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(password));
```

The backend then wraps the SHA-512 hash with Django's PBKDF2 hasher for storage. The overridden `User.check_password()` detects pre-hashed values (128-char hex strings) and handles both frontend logins and Django admin panel logins correctly.

### Device Verification Flow
1. User registers → `DeviceVerification` record created with status `pending`
2. Admin approves the device via Django admin panel or API
3. User logs in → device status is checked before issuing JWT
4. Only `approved` devices receive tokens
5. Admin role bypasses device verification entirely
6. Rejected devices receive a `403` response

### JWT Session Handling
- Access token stored in a cookie, expires in 60 minutes (configurable)
- Refresh token stored in a cookie, expires in 1 day (configurable)
- Axios interceptor automatically retries on `401` after refreshing the access token
- On refresh failure, tokens are cleared and user is redirected to `/login`
- Logout blacklists the refresh token server-side via `rest_framework_simplejwt.token_blacklist`

### Security Headers (Django equivalents of Helmet)
The following Django settings replace Helmet's functionality:

```python
SECURE_BROWSER_XSS_FILTER = True      # X-XSS-Protection
X_FRAME_OPTIONS = 'DENY'              # X-Frame-Options
SECURE_CONTENT_TYPE_NOSNIFF = True    # X-Content-Type-Options
```

Additionally, `corsheaders.middleware.CorsMiddleware` enforces strict CORS origin control.

### Rate Limiting
Applied via DRF throttling:
- Anonymous users: 100 requests/minute
- Authenticated users: 200 requests/minute

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Register new user (parent or student) |
| `POST` | `/api/auth/login/` | Login — returns access + refresh JWT |
| `POST` | `/api/auth/logout/` | Blacklist refresh token |
| `POST` | `/api/auth/token/refresh/` | Refresh access token |

**Login request body:**
```json
{
  "email": "user@example.com",
  "password": "<sha512_hex_128_chars>",
  "device_id": "unique-device-identifier"
}
```

**Login response:**
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "role": "parent",
    "is_verified": true,
    "created_at": "2026-03-01T10:00:00Z"
  }
}
```

### Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/` | List all users (filter: `?role=student`) |
| `GET` | `/api/users/{id}/` | Get user details |
| `GET` | `/api/users/me/` | Get current authenticated user |
| `PATCH` | `/api/users/{id}/toggle-active/` | Activate or deactivate user |

### Device Verification
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/devices/` | List requests (filter: `?status=pending`) |
| `GET` | `/api/devices/{id}/` | Get device details |
| `POST` | `/api/devices/{id}/approve/` | Approve a device |
| `POST` | `/api/devices/{id}/reject/` | Reject a device |

### Fees
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/fee-accounts/` | List fee accounts |
| `GET` | `/api/fee-accounts/{id}/` | Get account with recent transactions |
| `POST` | `/api/fee-accounts/{id}/deposit/` | Record a fee payment |
| `POST` | `/api/fee-accounts/{id}/withdraw/` | Request a refund |

**Deposit / Withdraw request body:**
```json
{
  "amount": 5000.00,
  "description": "Term 2 fees"
}
```

### Academics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/grades/` | List grades |
| `POST` | `/api/grades/` | Create grade (teacher) |
| `PUT/PATCH` | `/api/grades/{id}/` | Update grade (teacher) |
| `GET` | `/api/attendance/` | List attendance records |
| `POST` | `/api/attendance/` | Create attendance record (teacher) |
| `PUT/PATCH` | `/api/attendance/{id}/` | Update attendance (teacher) |
| `GET` | `/api/timetable/` | List timetable entries |
| `POST` | `/api/timetable/` | Create timetable entry |

### Classes & Profiles
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/classes/` | List or create classes |
| `GET` | `/api/classes/{id}/timetable/` | Get timetable for a specific class |
| `GET` | `/api/classes/{id}/students/` | Get students enrolled in a class |
| `GET/POST` | `/api/student-profiles/` | List or create student profiles |
| `GET/POST` | `/api/teacher-profiles/` | List or create teacher profiles |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats/` | Returns total students, teachers, classes, fee collected, pending devices, attendance rate |

---

## API Documentation (Swagger)

Once the backend is running:

- **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
- **ReDoc:** `http://127.0.0.1:8000/api/redoc/`
- **OpenAPI Schema (JSON):** `http://127.0.0.1:8000/api/schema/`

To test protected endpoints in Swagger UI, click **Authorize** and enter:
```
Bearer <your_access_token>
```

---

## Admin Interface

Django's built-in admin panel provides the Admin/Management Application interface:

```
http://127.0.0.1:8000/admin/
```

Log in with the superuser credentials. From here admins can:

- View and manage all users (activate/deactivate accounts)
- **Approve or reject device verification requests** — required before users can log in
- Create and manage classes, subjects, and timetable entries
- Assign teachers to classes
- View and manage grades and attendance records
- Monitor all fee accounts and transactions
- Access dashboard statistics via the API

---

## Role-Based Access

| Role | Registration | Device Bypass | Capabilities |
|---|---|---|---|
| `admin` | `createsuperuser` only | ✅ Yes | Full access to all data |
| `teacher` | API registration | ❌ No | Update grades and attendance |
| `student` | API registration | ❌ No | View own grades, attendance, timetable, fees |
| `parent` | API registration | ❌ No | View child's academic records and fee balance |

Self-registration as `admin` is blocked at the serializer level:

```python
def validate_role(self, value):
    if value == 'admin':
        raise ValidationError('Cannot self-register as admin.')
    return value
```

---

## Environment Variables Reference

### Backend `.env.example`

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=1
```

### Frontend `.env.example`

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

---

## Known Limitations & Assumptions

| Item | Detail |
|---|---|
| **Single repository** | The spec requires two separate repos (Client + Admin). This is a mono-repo for development convenience. In production, frontend and backend would be split and deployed separately. |
| **Admin frontend** | The admin interface uses Django's built-in admin panel instead of a dedicated React admin SPA. A separate React admin app is a planned extension. |
| **Teacher frontend** | Teachers can update grades and attendance via the API but no dedicated teacher UI exists in the frontend yet. |
| **Session inactivity timeout** | JWT expiry is configured but client-side idle timeout (auto-logout on inactivity) is not yet implemented. |
| **Database** | SQLite is used for development. Switch to PostgreSQL for production by updating `DATABASES` in `settings.py`. |
| **Fee account creation** | A `FeeAccount` must be created for each student via the Django admin panel or API after the student profile is set up. |
| **Push notifications** | Not implemented. The spec lists this as a mobile bonus feature; this project implements a web client. |
| **Mobile app** | Not implemented. A dedicated web client is provided per the spec's fallback option. |

---

## Bonus Features Implemented

- ✅ **Swagger / OpenAPI documentation** — auto-generated via `drf-spectacular`
- ✅ **Rate limiting** — DRF throttling on all endpoints
- ✅ **Layered architecture** — routes → views → serializers (DTOs) → models
- ✅ **Low fee balance alerts** — frontend banner when balance < KES 5,000
- ✅ **JWT token blacklisting** on logout
- ✅ **Auto token refresh** — Axios interceptor retries failed requests transparently