# Live Session Toolkit — Step 1: Project Scaffold

This is the foundation of the project: Next.js (frontend) + Express + Socket.IO
(real-time engine) + Prisma/MySQL (database).

## What's in this step
- `server.js` — custom server running Next.js and Socket.IO together
- `prisma/schema.prisma` — MySQL database schema (Sessions, Polls, Options, Responses, Participants)
- `pages/index.js` — placeholder host dashboard
- `pages/join/[code].js` — placeholder participant join page
- Tailwind CSS already configured

## Setup Instructions

### 1. Install Node.js
If you don't have it: https://nodejs.org (LTS version)

### 2. Install MySQL
- Easiest: install **XAMPP** or **MySQL Community Server** locally
- Create a database called `live_session_toolkit`

### 3. Install project dependencies
Open a terminal in this folder and run:
```bash
npm install
```

### 4. Set up environment variables
```bash
cp .env.example .env
```
Then open `.env` and update `DATABASE_URL` with your real MySQL username/password.

Example if your MySQL root user has no password:
```
DATABASE_URL="mysql://root:@localhost:3306/live_session_toolkit"
```

### 5. Create the database tables
```bash
npm run prisma:migrate
```
This reads `prisma/schema.prisma` and creates all the tables in MySQL automatically.

### 6. Run the project
```bash
npm run dev
```
Visit **http://localhost:3000** — you should see the "Live Session Toolkit" placeholder page.

Visit **http://localhost:3000/join/TEST123** — you should see the placeholder join page.

---

## ✅ Checkpoint before Step 2
Before we move on, make sure:
1. `npm install` completed with no errors
2. `npm run prisma:migrate` successfully created tables (check with `npm run prisma:studio` to view your database visually in the browser)
3. `npm run dev` starts the server and both pages load

Once this works, tell me and we'll move to **Step 2: Instant Poll Creation**
(host dashboard UI + create/launch a poll + QR code join flow).
