import React from 'react';

export default function SuggestedQuestions({ suggestions = [], onClick }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-slate-500">Suggested questions</div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onClick(q)}
            className="px-3 py-1.5 rounded-md border text-sm bg-white hover:shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
