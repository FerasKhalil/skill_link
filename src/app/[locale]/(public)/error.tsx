'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">!</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-slate-500 mb-6 max-w-md">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-emerald-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Try again
          </button>
          <a
            href="/en"
            className="rounded-xl border border-slate-200 text-slate-700 px-6 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
