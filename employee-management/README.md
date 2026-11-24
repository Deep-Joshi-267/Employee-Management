# 🏢 Employee Management System (EMS)
> **A Comprehensive Full-Stack Learning Project for REST APIs, HTTP Methods & PostgreSQL Integration**

---

## 🎯 Project Purpose & Learning Objectives

This project was designed and built as a practical, real-world educational blueprint to understand:
1. **RESTful Architecture:** What constitutes a true REST API and how resources are modeled.
2. **HTTP Methods in Action:** Understanding the real-world purpose and behavior of `GET`, `POST`, `PUT`, and `DELETE`.
3. **Database Connectivity:** Hooking a Node.js/Express server to a relational database (**PostgreSQL**) with connection pooling.
4. **Client-Server Communication:** Handling asynchronous HTTP requests from a modern **React 19** frontend using native `fetch()`, managing loading states, and gracefully handling errors.
5. **State Management & Persistence:** LocalStorage state recovery across browser refreshes, client-side pagination, and form handling.

---

## 🧠 What is a REST API?

**REST** stands for **RE**presentational **S**tate **T**ransfer. It is an architectural style governing how independent systems exchange data over HTTP.

### Core Principles Demonstrated in this Project:
- **Resource-Oriented URLs (Nouns, Not Verbs):** 
  Instead of non-RESTful action URLs like `/api/getEmployees` or `/api/deleteEmployee`, all operations target the resource noun:
  `/api/employees` or `/api/employees/:emp_id`.
- **HTTP Methods as Action Verbs:** The action performed is strictly dictated by the HTTP method sent in the request header.
- **Stateless Communication:** The server does not maintain client sessions. Every incoming request contains all necessary data to execute the query.
- **JSON Data Exchange:** Both request payloads and responses use standard `application/json`.
- **Meaningful HTTP Status Codes:** Every endpoint communicates the operation outcome using standardized HTTP response codes.

---

## 🌐 The HTTP Methods & CRUD Lifecycle

This project implements the complete **CRUD** (Create, Read, Update, Delete) lifecycle mapped to standard HTTP methods:

| CRUD Operation | HTTP Method | Endpoint URL | Status Code | Description & Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Read** | `GET` | `/api/employees` | `200 OK` | Retrieves all employee records sorted by creation date (`ORDER BY created_at DESC`). |
| **Create** | `POST` | `/api/employees` | `201 Created` | Validates input, prevents duplicate `emp_id` or `email`, and inserts a new employee record. |
| **Update** | `PUT` | `/api/employees/:emp_id` | `200 OK` | Verifies employee existence, validates email conflict against other employees, and updates full details. |
| **Delete** | `DELETE` | `/api/employees/:emp_id` | `200 OK` | Verifies existence and deletes the specified employee record from the database. |

---

### Detailed Breakdown of Each Endpoint

#### 1. `GET /api/employees` (Read)
- **Purpose:** Fetch existing records from the database.
- **Safe & Idempotent:** `GET` requests never alter database state.
- **SQL Executed:**
  ```sql
  SELECT * FROM employees ORDER BY created_at DESC;
  ```
- **Response Format:** Array of employee objects (`200 OK`).

---

#### 2. `POST /api/employees` (Create)
- **Purpose:** Submit a new record to be stored in the database.
- **Request Body (JSON):**
  ```json
  {
    "emp_id": "EMP001",
    "name": "Jane Doe",
    "email": "jane.doe@company.com",
    "phone": "9876543210",
    "position": "Senior Developer",
    "department": "Engineering",
    "salary": 850000,
    "date_of_joining": "2026-01-15"
  }
  ```
- **Validation Rules:**
  - All fields are strictly required (`400 Bad Request` if missing).
  - Uniqueness checks for both `emp_id` and `email` before insertion (`400 Bad Request` if duplicate).
- **SQL Executed:**
  ```sql
  INSERT INTO employees (emp_id, name, email, phone, position, department, salary, date_of_joining)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *;
  ```
- **Response:** `201 Created` with the newly inserted record.

---

#### 3. `PUT /api/employees/:emp_id` (Update)
- **Purpose:** Fully update an existing employee identified by URL parameter `emp_id`.
- **Validation Rules:**
  - Checks if the employee exists (`404 Not Found` if missing).
  - Ensures the updated email is not already taken by *another* employee (`400 Bad Request`).
- **SQL Executed:**
  ```sql
  UPDATE employees
  SET name = $1, email = $2, phone = $3, position = $4, department = $5, salary = $6, date_of_joining = $7
  WHERE emp_id = $8
  RETURNING *;
  ```
- **Response:** `200 OK` with updated employee details.

---

#### 4. `DELETE /api/employees/:emp_id` (Delete)
- **Purpose:** Remove an employee from the system.
- **Validation Rules:**
  - Verifies the employee exists prior to deletion (`404 Not Found`).
- **SQL Executed:**
  ```sql
  DELETE FROM employees WHERE emp_id = $1;
  ```
- **Response:** `200 OK` with `{ "message": "Employee deleted successfully" }`.

---

## 🗄️ Database Schema (PostgreSQL)

The backend connects to PostgreSQL using the official `pg` connection pool. Run the following SQL to set up the database:

```sql
CREATE DATABASE "Ems";

\c Ems;

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    emp_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    salary NUMERIC(12, 2) NOT NULL,
    date_of_joining DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🏗️ Architecture & Project Structure

The project uses a unified monorepo structure. Both client and server run concurrently with a single command:

```text
Employee-Mgmt/
├── README.md                          # Root educational & architecture documentation
└── employee-management/               # Main application container
    ├── package.json                   # Root scripts & dependencies (concurrently, Vite, React)
    ├── .gitignore                     # Ignores node_modules, .env secrets, build artifacts
    ├── server/                        # Express.js REST API Backend
    │   ├── .env                       # Local DB environment secrets (git-ignored)
    │   ├── .env.example               # Template environment configuration
    │   ├── db.js                      # PostgreSQL connection pool configuration
    │   ├── index.js                   # Express REST endpoints & middleware
    │   └── package.json               # Backend dependencies (express, pg, cors, dotenv, nodemon)
    ├── src/                           # React 19 Frontend
    │   ├── App.jsx                    # Primary component: state, API calls, pagination, forms
    │   ├── App.css                    # Modern UI styling, dark sidenav, cards, responsive layouts
    │   ├── index.css                  # Global variables, typography, reset
    │   └── main.jsx                   # React root entry point
    └── index.html                     # HTML document shell
```

---

## ✨ Key Frontend Features

1. **Persistent State across Refreshes (`localStorage`):**
   - Active Tab (`ems_active_tab`): Stay on your current tab even after pressing F5.
   - Sidenav State (`ems_sidebar_expanded`): Remembers if the sidebar was collapsed or expanded.
   - Current Page (`ems_current_page`): Remembers which page of employees you were viewing.
   - Form Draft (`ems_add_form_data`): Automatically saves partially typed form inputs.
2. **Client-Side Pagination (9 Cards per Page):**
   - Renders exactly 9 employee cards per page in a balanced 3×3 grid.
   - Interactive page buttons with active state highlighting and Previous/Next controls.
   - Dynamic counter: *"Showing X to Y of Z employees"*.
   - Auto-fallback: If all employees on the last page are deleted, the view automatically shifts to the preceding page.
3. **Form Validations:**
   - 10-digit mobile number constraint.
   - Regular expression email format verification.
   - Positive numeric salary validation.
4. **Toast Notification System:**
   - Real-time feedback banners for successful registrations, updates, deletions, and network/server errors.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) running locally

### 2. Environment Configuration
Navigate to `employee-management/server/` and create a `.env` file (you can copy `.env.example`):

```env
PORT=5000
DB_USER=postgres
DB_HOST=127.0.0.1
DB_NAME=Ems
DB_PASSWORD=your_postgres_password
DB_PORT=5432
```

### 3. Installation & Running Both Servers
You only need a single terminal!

```bash
# Navigate to the employee-management directory
cd employee-management

# Install dependencies
npm install
npm --prefix server install

# Start both Frontend (Vite) and Backend (Express + Nodemon) concurrently
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api`

---

## 🔒 Security Best Practices Implemented
- **No Hardcoded Credentials:** Database passwords and ports are completely isolated inside `.env`.
- **Git Protection:** `.env` and `node_modules` are excluded in `.gitignore` to prevent secret leakage.
- **SQL Injection Prevention:** All SQL queries utilize parameterized placeholders (`$1, $2, ...`) instead of string interpolation.

---

## 📝 License
This project is open-source and free to use for educational and learning purposes.
