// pages/api/session-results.js
// Returns every poll in a session, with each option's vote count AND
// the list of participants (name/email) who chose that option.
// Usage: /api/session-results?code=AB12CD
 
const prisma = require("../../lib/prisma");
 
export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) {
    res.status(400).json({ error: "Missing session code" });
    return;
  }
 
  try {
    const session = await prisma.session.findUnique({
      where: { code },
      include: {
        polls: {
          orderBy: { createdAt: "asc" },
          include: {
            options: {
              include: {
                responses: {
                  include: {
                    participant: true,
                  },
                },
              },
            },
          },
        },
      },
    });
 
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
 
    const polls = session.polls.map((poll) => ({
      id: poll.id,
      question: poll.question,
      createdAt: poll.createdAt,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        votes: opt.responses.length,
        voters: opt.responses.map((r) => ({
          name: r.participant.name || "Anonymous",
          email: r.participant.email,
        })),
      })),
    }));
 
    res.status(200).json({
      title: session.title,
      code: session.code,
      createdAt: session.createdAt,
      polls,
    });
  } catch (err) {
    console.error("Error fetching session results:", err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
}
 























