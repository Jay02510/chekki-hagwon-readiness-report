export default function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-10">
      <div className="flex justify-between font-body text-xs text-ink/60 mb-2">
        <span>Question {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 bg-line rounded-full overflow-hidden">
        <div className="h-full bg-forest transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
