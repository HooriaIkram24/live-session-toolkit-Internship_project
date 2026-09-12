// components/QuestionBox.jsx
// Lets a participant type and submit a question to the host at any time
// (not tied to whether a poll is currently active).

import { useState } from "react";

export default function QuestionBox({ socket, sessionCode }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!text.trim() || !socket) return;

    socket.emit("participant:submit-question", { sessionCode, text: text.trim() }, (res) => {
      if (res.error) {
        setError(res.error);
        return;
      }
      setText("");
      setSent(true);
      setError("");
      setTimeout(() => setSent(false), 2000);
    });
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl shadow p-4 w-full max-w-md flex flex-col gap-2">
      <p className="text-sm font-medium text-slate-700">💬 Have a question?</p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type your question..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
        >
          Send
        </button>
      </div>
      {sent && <p className="text-xs text-green-600">✓ Question sent to host</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
