export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-200 rounded-3xl h-32 animate-pulse" />
        ))}
      </div>
      <div className="bg-slate-200 rounded-3xl h-96 animate-pulse" />
    </div>
  );
}

export function TableLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-slate-200 rounded-lg h-12 animate-pulse" />
      ))}
    </div>
  );
}

export function CardLoadingSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <div className="h-8 bg-slate-200 rounded-lg w-1/3 animate-pulse" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function ErrorDisplay({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
      <h3 className="font-bold text-red-800 mb-2">Failed to load</h3>
      <p className="text-red-700 text-sm mb-4">{error.message}</p>
      <button
        onClick={onRetry}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
      >
        Try again
      </button>
    </div>
  );
}
