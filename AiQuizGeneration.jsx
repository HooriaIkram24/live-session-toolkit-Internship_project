// components/AiQuizGeneration.jsx
// A SEPARATE feature from "AI Poll Generation".
// Host enters a topic AND how many questions they want (e.g. 10, 20, 50) ->
// AI generates exactly that many multiple-choice questions -> host clicks
// ONE button ("Launch All") and every question is created at once.
// Participants then solve ALL questions themselves, at their own pace,
// via their join link -- no further clicking needed from the host.

import { useState } from "react";

export default function AiQuizGeneration({ socket, sessionCode }) {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [launched, setLaunched] = useState(false);

  async function generate(e) {
    e.preventDefault();
    if (!topic.trim()) return;

    const count = Math.min(50, Math.max(1, parseInt(numQuestions, 10) || 10));

    setLoading(true);
    setError("");
    setQuestions([]);
    setLaunched(false);

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, numQuestions: count }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setQuestions(data.questions || []);
      }
    } catch (err) {
      setError("Something went wrong generating the quiz.");
    } finally {
      setLoading(false);
    }
  }

  function launchAll() {
    if (!socket || !sessionCode || questions.length === 0) return;
    const minutes = Math.min(180, Math.max(1, parseInt(timeLimit, 10) || 10));
    socket.emit("host:launch-quiz-set", { sessionCode, questions, timeLimitMinutes: minutes });
    setLaunched(true);
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 w-full max-w-md">
      <h2 className="text-lg font-semibold text-slate-800">🧠 AI Quiz Generation</h2>
      <p className="text-xs text-slate-400 -mt-2">
        Give a topic and how many questions you want. Students solve them all at their own pace.
      </p>

      <form onSubmit={generate} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Enter a topic (e.g. World History)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500 whitespace-nowrap">Number of questions</label>
          <input
            type="number"
            min={1}
            max={50}
            placeholder="e.g. 20"
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            className="w-24 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500 whitespace-nowrap">Time limit (minutes)</label>
          <input
            type="number"
            min={1}
            max={180}
            placeholder="e.g. 10"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            className="w-24 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition"
        >
          {loading ? "Generating..." : "✨ Generate Quiz"}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {questions.length > 0 && !launched && (
        <button
          onClick={launchAll}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition"
        >
          🚀 Launch All ({questions.length} question{questions.length !== 1 ? "s" : ""})
        </button>
      )}

      {launched && (
        <p className="text-sm text-green-600 font-medium">
          ✅ All {questions.length} questions are live with a {timeLimit}-minute timer. Students can now solve them at their own pace via their join link.
        </p>
      )}

      {questions.length > 0 && (
        <details className="text-sm text-slate-400">
          <summary className="cursor-pointer">Preview all questions</summary>
          <div className="flex flex-col gap-3 mt-2">
            {questions.map((q, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3">
                <p className="font-medium text-slate-800 mb-2">{i + 1}. {q.question}</p>
                <ul className="text-sm text-slate-500 list-disc list-inside">
                  {q.options.map((opt, j) => (
                    <li key={j} className={j === q.correctIndex ? "text-green-600 font-medium" : ""}>
                      {opt}{j === q.correctIndex && " ✓"}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
