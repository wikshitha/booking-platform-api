# 🚀 Booking Platform REST API

A production-ready REST API built with **NestJS**, **TypeScript**, **Prisma ORM**, and **PostgreSQL** for managing services and customer bookings.

---

# 📌 Project Overview

The Booking Platform REST API allows businesses to manage services while enabling customers to create bookings without requiring authentication.

The system provides:

- JWT Authentication
- Service Management
- Booking Management
- Business Rule Validation
- Swagger API Documentation
- Docker Support
- Prisma ORM Integration
- PostgreSQL Database
- Global Exception Handling
- Unit Testing

---

# ✨ Features

## 🔐 Authentication

- Register
- Login
- JWT Authentication
- Password Hashing using bcrypt

---

## 🛠 Service Management (Protected)

Authenticated users can:

- Create Service
- Update Service
- Delete Service
- Get All Services
- Get Service by ID

---

## 📅 Booking Management

Customers can:

- Create Booking (No Authentication Required)

Authenticated users can:

- View All Bookings
- View Booking by ID
- Update Booking Status
- Cancel Booking

---

## ✅ Business Rules

The system enforces the following rules:

- Booking must belong to an existing service.
- Booking date cannot be in the past.
- Duplicate booking slots are prevented.
- Cancelled bookings cannot be completed.
- Completed bookings cannot be cancelled.
- Only authenticated users can manage services.

---

# 🏗 Technology Stack

| Category | Technology |
|------------|------------|
| Framework | NestJS 11 |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma ORM |
| Authentication | JWT |
| Password Hashing | bcrypt |
| Validation | class-validator |
| API Documentation | Swagger |
| Containerization | Docker |
| Testing | Jest |
| Package Manager | npm |

---

# 📂 Project Structure

```text
booking-platform-api
│
├── prisma
│   ├── migrations
│   └── schema.prisma
│
├── screenshots
│
├── src
│   ├── auth
│   ├── bookings
│   ├── services
│   ├── users
│   ├── prisma
│   ├── common
│   ├── generated
│   ├── app.module.ts
│   └── main.ts
│
├── .env.example
├── .env.docker
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

# 🏛 System Architecture

```text
               Client

                  │

                  ▼

          NestJS REST API

     ┌──────────┴───────────┐

     │                      │

 Authentication      Booking Module

     │                      │

 Service Module      Prisma ORM

             │

             ▼

       PostgreSQL Database
```

---

# 🗄 Database Design

## User

| Field | Type |
|---------|------|
| id | UUID |
| name | String |
| email | String |
| password | String |

---

## Service

| Field | Type |
|---------|------|
| id | UUID |
| title | String |
| description | String |
| duration | Integer |
| price | Decimal |
| isActive | Boolean |

---

## Booking

| Field | Type |
|---------|------|
| id | UUID |
| customerName | String |
| customerEmail | String |
| customerPhone | String |
| bookingDate | Date |
| bookingTime | Time |
| status | Enum |
| notes | String |
| serviceId | UUID |

---

Relationship

```text
Service (1)

     │

     │

Booking (Many)
```

---

# ⚙ Environment Variables

Create a `.env` file.

Example:

```env
PORT=3000

DATABASE_URL="postgresql://postgres:password@localhost:5432/booking_platform"

JWT_SECRET="your-secret-key"

JWT_EXPIRES_IN="1d"
```

---

# 📥 Installation

Clone the repository

```bash
git clone https://github.com/wikshitha/booking-platform-api.git
```

Move into the project

```bash
cd booking-platform-api
```

Install dependencies

```bash
npm install
```

---

# 🐘 Database Setup

Run PostgreSQL locally or using Docker.

Generate Prisma Client

```bash
npx prisma generate
```

Run migrations

```bash
npx prisma migrate deploy
```

For development

```bash
npx prisma migrate dev
```

---

# ▶ Running the Application

Development

```bash
npm run start:dev
```

Production

```bash
npm run build
npm run start:prod
```

---

# 🐳 Docker

Build and start containers

```bash
docker compose up --build
```

Stop containers

```bash
docker compose down
```

---

# 📖 API Documentation

This project uses **Swagger** for interactive API documentation.

After starting the application, Swagger UI is available at:

```
http://localhost:3000/api/docs
```

Swagger includes:

- Authentication APIs
- Service Management APIs
- Booking Management APIs
- Request/Response Schemas
- Validation Rules
- Authentication Support (JWT)

Use the **Authorize** button in Swagger to provide a JWT access token for protected endpoints.

---

# 🧪 Unit Testing

Run all unit tests

```bash
npm test
```

Run test coverage

```bash
npm run test:cov
```

Current Result

```
Test Suites: 3 passed
Tests: 32 passed
```

---

# 📷 Screenshots

Project screenshots are available in the `screenshots/` directory.

Examples include:

- Swagger Documentation
- Authentication APIs
- Service APIs
- Booking APIs
- Docker Containers
- Unit Test Results

---

# 📄 API Endpoints

## Authentication

| Method | Endpoint |
|---------|----------|
| POST | /auth/register |
| POST | /auth/login |

---

## Services

| Method | Endpoint |
|---------|----------|
| POST | /services |
| GET | /services |
| GET | /services/:id |
| PATCH | /services/:id |
| DELETE | /services/:id |

---

## Bookings

| Method | Endpoint |
|---------|----------|
| POST | /bookings |
| GET | /bookings |
| GET | /bookings/:id |
| PATCH | /bookings/:id/status |
| PATCH | /bookings/:id/cancel |

---

# 📌 Assumptions Made

- Each booking is associated with exactly one existing service.
- A single service can have multiple bookings.
- Customers are not required to register or authenticate to create bookings.
- Only authenticated users can manage services and booking statuses.
- Booking dates cannot be in the past.
- Each service can have only one booking for the same date and time slot.
- Booking status transitions follow the defined business rules (e.g., a cancelled booking cannot be marked as completed).

---

# 🚀 Future Improvements

- Refresh Token Authentication
- User Roles (Admin/Staff)
- Email Notifications
- Booking Availability Calendar
- Service Categories
- Payment Gateway Integration
- Booking Rescheduling
- Audit Logging
- Rate Limiting
- CI/CD Pipeline Deployment

---

# 👨‍💻 Author

**Wikshitha Umindu**

Software Engineer Intern Candidate

Built using:

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Docker