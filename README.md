🎓 Live Session Toolkit

A real-time live polling, quiz, and Q&A toolkit for classrooms, training sessions, and live events — built with Next.js, Express, Socket.IO, and Prisma/MySQL, with AI-generated quizzes and session insights powered by Google Gemini.

Hosts can launch instant polls or full AI-generated quizzes, watch results update live, track attendance and participation, and get an AI summary of how the session went — all in one dashboard.

✨ Features
•⚡ Instant Polls — host types a question + options, launches it, and sees a live-updating bar chart of responses in real time.
•🤖 AI Poll Generator — give a topic, AI (Gemini) generates ready-to-launch multiple-choice quiz questions with correct answers.
•🧠 AI Quiz Generation (Self-Paced Quiz Set) — generate a full batch of questions (up to 50) on a topic with a time limit. Participants solve all questions at their own pace via their join link, with Back/Next navigation and a live countdown timer, then see their score.
•💬 Q&A Panel — participants can ask questions at any time; host sees them live and marks them as answered.
•📱 QR Code Join — auto-generated QR code and join link for each session, so participants can join instantly from their phone.
•📊 Results & Attendance — host-facing pages showing every poll's results (with who voted for what), plus per-participant attendance and participation rate.
•📋 Session History — every past session is saved and browsable, with quick stats (poll count, participant count).
•🤖 AI Session Insights — one click generates a plain-language summary of how the session went (engagement, weak areas, suggestions) based on the actual poll data.
🛠 Tech Stack
•Frontend: Next.js (Pages Router), React, Tailwind CSS
•Real-time engine: Express + Socket.IO (custom server, server.js)
•Database: MySQL via Prisma ORM
•AI: Google Gemini API (@google/genai) for quiz generation and session insights
•Charts: Recharts
•QR codes: qrcode
📂 Project Structure
•server.js — custom server running Next.js and Socket.IO together, plus all real-time event handlers
•prisma/schema.prisma — MySQL schema (Host, Session, Participant, Poll, Option, Response, Question)
•pages/index.js — host dashboard (create session, launch polls/quizzes, live results, Q&A)
•pages/join/index.js — manual join entry (type a session code)
•pages/join/[code].js — participant view (poll / quiz set / Q&A)
•pages/results/[code].js — host-facing results + AI insights
•pages/attendance/[code].js — host-facing attendance/participation tracking
•pages/history.js — list of all past sessions
•pages/api/ — REST endpoints for QR codes, quiz generation, session results/history/attendance/insights
•components/ — PollForm, AiQuizGenerator, AiQuizGeneration, LiveResults, QandAPanel, QuestionBox
🚀 Setup Instructions
1. Install Node.js

•If you don't have it: https://nodejs.org (LTS version)

2. Install MySQL
•Easiest: install XAMPP or MySQL Community Server locally
•Create a database called live_session_toolkit
3. Install project dependencies
bash
npm install
4. Set up environment variables
bash
cp .env.example .env

Then open .env and fill in:

DATABASE_URL — your MySQL connection string (e.g. mysql://root:@localhost:3306/live_session_toolkit if root has no password)
GEMINI_API_KEY — your own Google Gemini API key (get one at aistudio.google.com/apikey)

⚠️ Never commit your real .env file — it's already excluded via .gitignore.

5. Create the database tables
bash
npm run prisma:migrate
6. Run the project
bash
npm run dev

Visit http://localhost:3000 to start a session as the host.

📝 Notes / Known Limitations
•Live session state (active poll/quiz) lives in memory on the server — if the server restarts mid-session, participants will need to rejoin.
•All sessions currently belong to a single default host account (no multi-host login yet).
•Rejoining/refreshing mid-session creates a new participant record rather than resuming the previous one.
