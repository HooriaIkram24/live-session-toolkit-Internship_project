// components/QandAPanel.jsx
// Host-side view of all questions asked in the session, with a button
// to mark each as answered. Updates live as new questions come in.

import { useEffect, useState } from "react";

export default function QandAPanel({ socket, sessionCode }) {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!socket || !sessionCode) return;

    socket.emit("host:get-questions", { sessionCode }, (res) => {
      if (res.questions) setQuestions(res.questions);
    });

    function onAdded(q) {
      setQuestions((prev) => [...prev, q]);
    }
    function onAnswered({ questionId }) {
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, answered: true } : q)));
    }

    socket.on("question-added", onAdded);
    socket.on("question-answered", onAnswered);

    return () => {
      socket.off("question-added", onAdded);
      socket.off("question-answered", onAnswered);
    };
  }, [socket, sessionCode]);

  function markAnswered(questionId) {
    socket.emit("host:mark-answered", { sessionCode, questionId });
  }

  const unanswered = questions.filter((q) => !q.answered);
  const answered = questions.filter((q) => q.answered);

  return (
    <div className="bg-white rounded-xl shadow p-6 w-full max-w-md flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-800">💬 Q&amp;A</h2>

      {questions.length === 0 && (
        <p className="text-sm text-slate-400">No questions yet.</p>
      )}

      {unanswered.length > 0 && (
        <div className="flex flex-col gap-2">
          {unanswered.map((q) => (
            <div key={q.id} className="border border-slate-200 rounded-lg p-3 flex justify-between items-start gap-3">
              <div>
                <p className="text-slate-800">{q.text}</p>
                <p className="text-xs text-slate-400 mt-1">— {q.askedBy}</p>
              </div>
              <button
                onClick={() => markAnswered(q.id)}
                className="text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 whitespace-nowrap transition"
              >
                ✓ Answered
              </button>
            </div>
          ))}
        </div>
      )}

      {answered.length > 0 && (
        <details className="text-sm text-slate-400">
          <summary className="cursor-pointer">Answered ({answered.length})</summary>
          <div className="flex flex-col gap-2 mt-2">
            {answered.map((q) => (
              <div key={q.id} className="text-slate-400 line-through">
                {q.text} — {q.askedBy}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
