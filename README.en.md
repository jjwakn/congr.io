# 🚀 Setup Guide

## 📦 Prerequisites

Before starting, ensure you have the following ready:

- **PostgreSQL 17.5** database instance
- **AWS account** with S3 configured for image storage
- Properly configured **`.env` files** for both backend and frontend

---

## ⚙️ Setup Flow

1. **Prepare the database** (Postgres 17.5)
2. **Configure AWS S3** for image hosting
3. **Set environment variables** in the backend (`.env`)
4. **Deploy the backend**
5. **Set environment variables** in the frontend (`.env`)
6. **Deploy the frontend**

---

## 🛠 First-Time Setup (Initial Session)

When accessing the application for the first time:

### 1. Congregation Setup

- Check if a **congregation** exists in the database
  - **If not**, create a new congregation:
    - Configure congregation details
    - Add one or more **locations**
    - Assign **administrators** with full access
    - Configure the **AWS S3 bucket** for image storage
      - ⚠️ If this step fails, image uploads will be unavailable

    - Set the **preferred language** for the congregation

### 2. User Session

- Log in with your user account
- Choose and save your **theme preference** (Dark or Light mode)
