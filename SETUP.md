# Project Setup Guide

> **Quick Reference:** See [README.md](README.md) for dependencies and troubleshooting.

Follow these steps to set up the Angular Login Signup project from a fresh clone.

---

## Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages including Angular, Tailwind CSS, Angular Material, and backend dependencies.

---

## Step 2: Start the Database

**Ensure Docker Desktop is running**, then start the MySQL container:

```bash
docker compose up -d
```

**Import the database schema:**

```bash
docker exec -i angular_login_signup_mysql mysql -uuser -ppassword login_signup_db < db/schema.sql
```

> **Note:** Run the import command in a bash terminal (Git Bash on Windows).

**Verify it's running:**

```bash
docker ps
```

You should see `angular_login_signup_mysql` in the list.

---

## Step 3: Configure Environment Variables

Navigate to `backend/private/` and populate the `.env` file:

```plaintext
DB_HOST=localhost
DB_PORT=3306
DB_USER=user
DB_PASS=password
DB_NAME=login_signup_db
PORT=3000
```

> **Important:** Keep `PORT=3000` unchanged - this is the Express server port.

---

## Step 4: Start the Application

You need **two terminals** running simultaneously:

### Terminal 1 - Backend Server

```bash
npm run dev:backend
```

Or simply:

```bash
nodemon
```

✅ Backend runs on `http://localhost:3000`

### Terminal 2 - Frontend Server

```bash
ng serve
```

✅ Frontend runs on `http://localhost:4200`

---

## Step 5: Access the Application

Open your browser and navigate to:

**`http://localhost:4200/`**

You're all set! 🎉

---

## Database Management

### View running containers
```bash
docker ps
```

### Stop the database
```bash
docker compose down
```

### Fresh database (deletes all data)
```bash
docker compose down -v
docker compose up -d
docker exec -i angular_login_signup_mysql mysql -uuser -ppassword login_signup_db < db/schema.sql
```

> **Warning:** The `-v` flag permanently deletes all database data so you will have to import the schema.sql file again.

---

## Common Database Issues

### ❌ "Access denied"
- Check credentials in `backend/private/.env`
- Default: `user` / `password`

### ❌ "Connection refused"
- Wait a few seconds for MySQL to initialize
- Check logs: `docker logs angular_login_signup_mysql`

### ❌ Port 3306 already in use
Edit `docker-compose.yml`:
```yaml
ports:
  - "3307:3306"
```

Then update `.env`:
```plaintext
DB_PORT=3307
```

---

## Need Help?

See [README.md](README.md#troubleshooting) for full troubleshooting guide.