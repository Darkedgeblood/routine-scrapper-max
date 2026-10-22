export function AppSplash({ fading }: { fading: boolean }) {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none ${fading ? 'animate-splash-fade' : ''}`}>
      <img src="/app-icon.png" alt="Routine Scrapper Max" className="size-36 object-contain animate-app-intro" />
      <h1 className="mt-5 text-xl font-bold tracking-tight text-white">Routine Scrapper Max</h1>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">CSE Batch 69</p>
    </div>
  )
}
