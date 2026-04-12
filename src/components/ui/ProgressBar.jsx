export default function ProgressBar({ value, max = 100, className = '', showLabel = true }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
          <span>Progress</span>
          <span className="text-slate-900">{percent}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${percent === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
