// components/PollForm.jsx
// Lets the host type a question + a few options and launch it instantly.

import { useState } from "react";

export default function PollForm({ onLaunch }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  function updateOption(index, value) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  }

  function addOption() {
    if (options.length >= 6) return;
    setOptions([...options, ""]);
  }

  function removeOption(index) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleanOptions.length < 2) {
      alert("Add a question and at least 2 options.");
      return;
    }
    onLaunch({ question: question.trim(), options: cleanOptions, type: "multiple_choice" });
    setQuestion("");
    setOptions(["", ""]);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 w-full max-w-md">
      <h2 className="text-lg font-semibold text-slate-800">⚡ Launch a Poll</h2>

      <input
        type="text"
        placeholder="Type your question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-slate-400 hover:text-red-500 px-2"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addOption}
        className="text-sm text-indigo-600 hover:underline self-start"
      >
        + Add option
      </button>

      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition"
      >
        🚀 Launch Poll
      </button>
    </form>
  );
}
