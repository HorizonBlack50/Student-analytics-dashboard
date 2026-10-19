"use client";

import { useState } from "react";

export default function ClickCounter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="rounded-full bg-accent px-6 py-3 font-medium text-white shadow-md shadow-accent/30 transition hover:bg-accent-hover active:scale-95"
      >
        Click me
      </button>
      <button
        type="button"
        onClick={() => setCount(0)}
        disabled={count === 0}
        className="rounded-full border border-black/10 px-5 py-3 text-sm transition hover:bg-black/5 disabled:opacity-40"
      >
        Reset
      </button>
      <p className="text-lg tabular-nums">
        Clicked <span className="font-semibold">{count}</span>{" "}
        {count === 1 ? "time" : "times"}
      </p>
    </div>
  );
}
