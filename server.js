// server.js
// Custom server that runs Next.js AND Socket.IO together.
// Added: "Quiz Set" flow -- host generates N AI questions and clicks
// Launch ONCE. All N questions are created immediately, and every
// participant works through all of them at THEIR OWN PACE via their
// join link (submit answer -> next question appears for them), instead
// of the host having to push each question one at a time.

const express = require("express");
const next = require("next");
const http = require("http");
const { Server } = require("socket.io");
const { nanoid } = require("nanoid");
const prisma = require("./lib/prisma");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// ---- IN-MEMORY CACHE (mirrors the DB for fast real-time access) ----
// sessions = {
//   "AB12CD": {
//     dbId, title,
//     activePoll: single live-launched poll (Poll Form / AI Poll Generation / Manual Quiz),
//     quizSet: [ {id, question, options:[{id,text,votes}]}, ... ] -- self-paced quiz batch,
//     votesByPoll: { [pollId]: Set of socket.ids that already voted on that poll },
//     participantsBySocket: Map of socket.id -> participant DB id
//   }
// }
const sessions = {};

function generateSessionCode() {
  return nanoid(6).toUpperCase();
}

async function getOrCreateDefaultHost() {
  const existing = await prisma.host.findFirst({ where: { email: "host@local.dev" } });
  if (existing) return existing;
  return prisma.host.create({
    data: { name: "Default Host", email: "host@local.dev" },
  });
}

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // ---- HOST: create a new session ----
    socket.on("host:create-session", async ({ title }, callback) => {
      try {
        const host = await getOrCreateDefaultHost();
        const code = generateSessionCode();

        const dbSession = await prisma.session.create({
          data: {
            code,
            title: title || "Untitled Session",
            hostId: host.id,
          },
        });

        sessions[code] = {
          dbId: dbSession.id,
          title: dbSession.title,
          activePoll: null,
          quizSet: null,
          votesByPoll: {},
          participantsBySocket: new Map(),
        };

        socket.join(code);
        console.log(`Session created: ${code} (${title}) [DB id: ${dbSession.id}]`);
        if (callback) callback({ code });
      } catch (err) {
        console.error("Error creating session:", err);
        if (callback) callback({ error: "Failed to create session" });
      }
    });

    // ---- HOST: launch a single poll (Poll Form / AI Poll Generation / Manual Quiz) ----
    socket.on("host:launch-poll", async ({ sessionCode, question, type, options, correctIndex }) => {
      const session = sessions[sessionCode];
      if (!session) return;

      try {
        const dbPoll = await prisma.poll.create({
          data: {
            sessionId: session.dbId,
            question,
            type: type || "multiple_choice",
            aiGenerated: type === "quiz",
            options: {
              create: options.map((text, i) => ({
                text,
                isCorrect: correctIndex !== undefined && i === correctIndex,
              })),
            },
          },
          include: { options: true },
        });

        const poll = {
          id: dbPoll.id,
          question: dbPoll.question,
          type: dbPoll.type,
          options: dbPoll.options.map((o) => ({ id: o.id, text: o.text, votes: 0, isCorrect: o.isCorrect })),
        };

        session.activePoll = poll;
        session.votesByPoll[poll.id] = new Set();

        io.to(sessionCode).emit("poll-launched", poll);
        console.log(`Poll launched in ${sessionCode}: ${question} [DB id: ${dbPoll.id}]`);
      } catch (err) {
        console.error("Error launching poll:", err);
      }
    });

    // ---- HOST: launch an entire quiz set at once (self-paced for participants, with an overall timer) ----
    socket.on("host:launch-quiz-set", async ({ sessionCode, questions, timeLimitMinutes }) => {
      const session = sessions[sessionCode];
      if (!session || !Array.isArray(questions) || questions.length === 0) return;

      try {
        const createdPolls = [];

        for (const q of questions) {
          const dbPoll = await prisma.poll.create({
            data: {
              sessionId: session.dbId,
              question: q.question,
              type: "quiz",
              aiGenerated: true,
              options: {
                create: q.options.map((text, i) => ({
                  text,
                  isCorrect: q.correctIndex !== undefined && i === q.correctIndex,
                })),
              },
            },
            include: { options: true },
          });

          const poll = {
            id: dbPoll.id,
            question: dbPoll.question,
            type: dbPoll.type,
            options: dbPoll.options.map((o) => ({ id: o.id, text: o.text, votes: 0, isCorrect: o.isCorrect })),
          };

          createdPolls.push(poll);
          session.votesByPoll[poll.id] = new Set();
        }

        const quizSet = {
          questions: createdPolls,
          timeLimitMinutes: timeLimitMinutes || 10,
          startTime: Date.now(),
        };

        session.quizSet = quizSet;

        io.to(sessionCode).emit("quiz-set-launched", quizSet);
        console.log(`Quiz set of ${createdPolls.length} questions launched in ${sessionCode} with a ${quizSet.timeLimitMinutes}-minute timer`);
      } catch (err) {
        console.error("Error launching quiz set:", err);
      }
    });

    // ---- PARTICIPANT: join a session ----
    socket.on("participant:join", async ({ sessionCode, name, email }, callback) => {
      const session = sessions[sessionCode];
      if (!session) {
        if (callback) callback({ error: "Session not found" });
        return;
      }

      try {
        const participant = await prisma.participant.create({
          data: {
            sessionId: session.dbId,
            name: name || null,
            email: email || null,
          },
        });

        session.participantsBySocket.set(socket.id, participant.id);
        socket.join(sessionCode);

        if (callback) {
          callback({
            title: session.title,
            activePoll: session.activePoll,
            quizSet: session.quizSet || null, // { questions, timeLimitMinutes, startTime } or null
          });
        }
      } catch (err) {
        console.error("Error joining session:", err);
        if (callback) callback({ error: "Failed to join session" });
      }
    });

    // ---- PARTICIPANT: submit a response (works for both single polls and quiz-set questions) ----
    socket.on("participant:submit-response", async ({ sessionCode, pollId, optionId }, callback) => {
      const session = sessions[sessionCode];
      if (!session) {
        if (callback) callback({ error: "Session not found" });
        return;
      }

      // Find the poll among the single activePoll or the quiz set
      let poll = null;
      if (session.activePoll && session.activePoll.id === pollId) {
        poll = session.activePoll;
      } else if (session.quizSet && session.quizSet.questions) {
        poll = session.quizSet.questions.find((p) => p.id === pollId);
      }

      if (!poll) {
        if (callback) callback({ error: "Question no longer available" });
        return;
      }

      if (!session.votesByPoll[pollId]) session.votesByPoll[pollId] = new Set();
      if (session.votesByPoll[pollId].has(socket.id)) {
        if (callback) callback({ error: "You already answered this question" });
        return;
      }

      const option = poll.options.find((o) => o.id === optionId);
      if (!option) {
        if (callback) callback({ error: "Invalid option" });
        return;
      }

      const participantId = session.participantsBySocket.get(socket.id);
      if (!participantId) {
        if (callback) callback({ error: "Participant record not found, please rejoin" });
        return;
      }

      try {
        await prisma.response.create({
          data: { pollId, optionId, participantId },
        });

        option.votes += 1;
        session.votesByPoll[pollId].add(socket.id);

        // Live chart on host dashboard only tracks the single activePoll
        if (session.activePoll && session.activePoll.id === pollId) {
          io.to(sessionCode).emit("results-updated", session.activePoll);
        }

        if (callback) callback({ success: true });
      } catch (err) {
        console.error("Error saving response:", err);
        if (callback) callback({ error: "Failed to save response" });
      }
    });

    // ---- PARTICIPANT: submit a question (Q&A) ----
    socket.on("participant:submit-question", async ({ sessionCode, text }, callback) => {
      const session = sessions[sessionCode];
      if (!session) {
        if (callback) callback({ error: "Session not found" });
        return;
      }
      const participantId = session.participantsBySocket.get(socket.id);
      if (!participantId) {
        if (callback) callback({ error: "Participant record not found, please rejoin" });
        return;
      }
      if (!text || !text.trim()) {
        if (callback) callback({ error: "Question cannot be empty" });
        return;
      }

      try {
        const participant = await prisma.participant.findUnique({ where: { id: participantId } });
        const dbQuestion = await prisma.question.create({
          data: {
            sessionId: session.dbId,
            participantId,
            text: text.trim(),
          },
        });

        const question = {
          id: dbQuestion.id,
          text: dbQuestion.text,
          answered: false,
          askedBy: participant?.name || "Anonymous",
          createdAt: dbQuestion.createdAt,
        };

        io.to(sessionCode).emit("question-added", question);
        if (callback) callback({ success: true });
      } catch (err) {
        console.error("Error submitting question:", err);
        if (callback) callback({ error: "Failed to submit question" });
      }
    });

    // ---- HOST: get all questions for a session ----
    socket.on("host:get-questions", async ({ sessionCode }, callback) => {
      const session = sessions[sessionCode];
      if (!session) {
        if (callback) callback({ error: "Session not found" });
        return;
      }
      try {
        const dbQuestions = await prisma.question.findMany({
          where: { sessionId: session.dbId },
          include: { participant: true },
          orderBy: { createdAt: "asc" },
        });
        const questions = dbQuestions.map((q) => ({
          id: q.id,
          text: q.text,
          answered: q.answered,
          askedBy: q.participant?.name || "Anonymous",
          createdAt: q.createdAt,
        }));
        if (callback) callback({ questions });
      } catch (err) {
        console.error("Error fetching questions:", err);
        if (callback) callback({ error: "Failed to fetch questions" });
      }
    });

    // ---- HOST: mark a question as answered ----
    socket.on("host:mark-answered", async ({ sessionCode, questionId }) => {
      try {
        await prisma.question.update({
          where: { id: questionId },
          data: { answered: true },
        });
        io.to(sessionCode).emit("question-answered", { questionId });
      } catch (err) {
        console.error("Error marking question answered:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  server.set("io", io);
  server.all("*", (req, res) => handle(req, res));

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Live Session Toolkit running on http://localhost:${PORT}`);
  });
});
