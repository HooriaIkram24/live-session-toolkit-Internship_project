// components/AiQuizGenerator.jsx
// Host types a topic -> AI generates several ready-to-launch questions ->
// host picks one (or launches all) with a single click.

import { useState } from "react";

export default function AiQuizGenerator({ onLaunch }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");

  async function generate(e) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setQuestions([]);

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, numQuestions: 3 }),
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

    function launchQuestion(q) {
    onLaunch({ question: q.question, options: q.options, type: "quiz", correctIndex: q.correctIndex });
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 w-full max-w-md">
      <h2 className="text-lg font-semibold text-slate-800">🤖 AI Poll Generator</h2>

      <form onSubmit={generate} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Enter a topic (e.g. career planning for students)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition"
        >
          {loading ? "Generating..." : "✨ Generate Questions"}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {questions.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          {questions.map((q, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-3">
              <p className="font-medium text-slate-800 mb-2">{q.question}</p>
              <ul className="text-sm text-slate-500 mb-3 list-disc list-inside">
                {q.options.map((opt, j) => (
                  <li key={j} className={j === q.correctIndex ? "text-green-600 font-medium" : ""}>
                    {opt}{j === q.correctIndex && " ✓"}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => launchQuestion(q)}
                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 transition"
              >
                🚀 Launch this one
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
