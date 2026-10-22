export function DashboardFooter({ dot, pulse, label }: { dot: string; pulse: boolean; label: string }) {
  return (
    <footer className="mt-10 flex flex-col items-center gap-1.5 text-[12px] text-slate-400 dark:text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${dot} ${pulse ? 'animate-pulse' : ''}`} /> {label}
      </span>
      <span>Routine V4.1 · Effective 3 October 2026</span>
    </footer>
  )
}
