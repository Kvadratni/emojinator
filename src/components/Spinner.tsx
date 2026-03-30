"use client";

interface Props {
  message?: string;
}

export function Spinner({ message }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-6 py-4 flex items-center gap-3 shadow-xl">
        <svg
          className="animate-spin w-5 h-5 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm text-zinc-200">
          {message || "Loading..."}
        </span>
      </div>
    </div>
  );
}
