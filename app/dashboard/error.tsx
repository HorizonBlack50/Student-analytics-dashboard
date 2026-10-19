"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

// Shown if a database query fails (e.g. MySQL is not running). The sidebar stays
// visible because error.tsx does not wrap its own segment's layout. We never
// render error.message: in production it is generic anyway, and it could
// contain connection details in development.
export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-sm border border-gf-red/50 bg-gf-panel p-6">
      <h1 className="text-lg font-semibold text-gf-text">
        <span aria-hidden="true" className="text-gf-red">● </span>
        Couldn’t load data from the database
      </h1>
      <p className="max-w-2xl text-sm text-gf-muted">
        The dashboard could not read from MySQL. Check that the Docker MySQL container is running and that the
        connection settings in <code className="font-mono">.env</code> are correct, then try again. Details are in the
        server terminal.
      </p>
      {error.digest && (
        <p className="text-xs text-gf-muted">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-sm bg-gf-blue px-3 py-1.5 text-sm font-medium text-gf-canvas hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gf-blue"
      >
        Try again
      </button>
    </div>
  );
}
