'use client';

export default function RootNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
        <p className="text-slate-500 mb-6">The page you are looking for does not exist.</p>
        <a
          href="/en"
          className="rounded-xl bg-emerald-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
