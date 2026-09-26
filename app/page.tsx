'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronRight, Clock3, MapPin, Moon, Sun, Users, Zap } from 'lucide-react'

type ClassItem = {
  day: string
  start: string
  end: string
  course: string
  section: string
  room: string
  teacher: string
  retake?: boolean
}

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as const
const FULL_DAYS: Record<string, string> = {
  Sat: 'Saturday', Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
}
const TIMES = ['08:30', '10:00', '11:30', '13:00', '14:30', '16:00']

// Filtered from the attached CSE routine: Batch 69 regular sections and MAT211 RE_B(3C).
const classes: ClassItem[] = [
  { day: 'Sat', start: '08:30', end: '10:00', course: 'CSE215', section: '69_M', room: 'KT-216', teacher: 'NUM' },
  { day: 'Sat', start: '10:00', end: '11:30', course: 'CSE221', section: '69_K', room: 'KT-216', teacher: 'MIZ' },
  { day: 'Sat', start: '11:30', end: '13:00', course: 'MAT211', section: 'RE_B(3C)', room: 'KT-217', teacher: 'NRM', retake: true },
  { day: 'Sat', start: '14:30', end: '16:00', course: 'CSE215', section: '69_K', room: 'KT-208', teacher: 'MNS' },
  { day: 'Sun', start: '08:30', end: '10:00', course: 'CSE221', section: '69_C', room: 'KT-216', teacher: 'SZ' },
  { day: 'Sun', start: '10:00', end: '11:30', course: 'CSE221', section: '69_D', room: 'KT-216', teacher: 'SZ' },
  { day: 'Sun', start: '13:00', end: '14:30', course: 'CSE215', section: '69_N', room: 'KT-510', teacher: 'MLR' },
  { day: 'Sun', start: '14:30', end: '16:00', course: 'CSE222', section: '69_E1', room: 'G1-002', teacher: 'AUA' },
  { day: 'Mon', start: '08:30', end: '10:00', course: 'CSE215', section: '69_C', room: 'KT-220', teacher: 'MSU' },
  { day: 'Mon', start: '10:00', end: '11:30', course: 'CSE221', section: '69_M', room: 'KT-318(B)', teacher: 'AAA' },
  { day: 'Mon', start: '13:00', end: '14:30', course: 'MAT211', section: 'RE_B(3C)', room: 'ANX1-208', teacher: 'NRM', retake: true },
  { day: 'Mon', start: '16:00', end: '17:30', course: 'CSE216', section: '69_B1', room: 'SH-105', teacher: 'NAB' },
  { day: 'Tue', start: '08:30', end: '10:00', course: 'CSE222', section: '69_K', room: 'G1-002', teacher: 'FLA' },
  { day: 'Tue', start: '10:00', end: '11:30', course: 'CSE215', section: '69_F', room: 'KT-510', teacher: 'EHL' },
  { day: 'Tue', start: '14:30', end: '16:00', course: 'CSE221', section: '69_I', room: 'KT-501(A)', teacher: 'MIZ' },
  { day: 'Wed', start: '08:30', end: '10:00', course: 'CSE215', section: '69_O', room: 'KT-224', teacher: 'MNS' },
  { day: 'Wed', start: '11:30', end: '13:00', course: 'MAT211', section: 'RE_B(3C)', room: 'KT-217', teacher: 'NRM', retake: true },
  { day: 'Wed', start: '14:30', end: '16:00', course: 'CSE222', section: '69_N1', room: 'G1-012', teacher: 'SRS' },
  { day: 'Thu', start: '10:00', end: '11:30', course: 'CSE216', section: '69_C2', room: 'KT-810', teacher: 'MSU' },
  { day: 'Thu', start: '13:00', end: '14:30', course: 'CSE222', section: '69_B2', room: 'G1-001', teacher: 'MTN' },
  { day: 'Thu', start: '14:30', end: '16:00', course: 'CSE215', section: '69_F', room: 'KT-503', teacher: 'EHL' },
]

function getToday() {
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date())
  return DAYS.includes(day as (typeof DAYS)[number]) ? day : 'Sat'
}

export default function Page() {
  const [selectedDay, setSelectedDay] = useState(getToday())
  const [now, setNow] = useState(new Date())
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const dayClasses = useMemo(() => classes.filter((item) => item.day === selectedDay), [selectedDay])
  const regularCount = dayClasses.filter((item) => !item.retake).length
  const nextClass = dayClasses.find((item) => item.start > now.toTimeString().slice(0, 5))

  return (
    <main className={dark ? 'min-h-screen bg-[#08111b] text-slate-100' : 'min-h-screen bg-slate-50 text-slate-900'}>
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"><CalendarDays /></div>
            <div><p className="text-lg font-semibold tracking-tight">Routine</p><p className="text-xs text-slate-400">CSE · Batch 69</p></div>
          </div>
          <button aria-label="Toggle dark mode" onClick={() => setDark(!dark)} className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10">{dark ? <Sun /> : <Moon />}</button>
        </header>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="rounded-[2rem] border border-cyan-300/10 bg-gradient-to-br from-[#102b3c] via-[#0b1c2a] to-[#0a1722] p-5 shadow-2xl shadow-black/20 sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-cyan-300">{FULL_DAYS[selectedDay]}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your classes, <span className="text-cyan-300">at a glance.</span></h1></div><Zap className="mt-1 text-cyan-300" /></div>
            <div className="mt-8 flex items-end justify-between gap-4"><div><p className="font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p><p className="mt-1 text-sm text-slate-400">{now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p></div><div className="hidden text-right sm:block"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Next up</p><p className="mt-1 font-medium text-slate-200">{nextClass ? `${nextClass.course} · ${nextClass.start}` : 'No more classes'}</p></div></div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1"><div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><Users className="text-cyan-300" /><p className="mt-5 text-3xl font-semibold">{regularCount}</p><p className="text-sm text-slate-400">regular classes</p></div><div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-5"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-300" /><p className="text-xs font-semibold uppercase tracking-widest text-amber-200">Retake</p></div><p className="mt-5 text-3xl font-semibold">{dayClasses.filter((item) => item.retake).length}</p><p className="text-sm text-slate-400">MAT211 session</p></div></div>
        </section>

        <nav aria-label="Select a day" className="mt-8 flex gap-2 overflow-x-auto pb-1">{DAYS.map((day) => <button key={day} onClick={() => setSelectedDay(day)} className={`min-w-[58px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${selectedDay === day ? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/20' : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}><span className="block text-xs opacity-60">{day === getToday() ? 'Today' : FULL_DAYS[day].slice(0, 3)}</span>{day}</button>)}</nav>

        <section className="mt-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">{FULL_DAYS[selectedDay]} schedule</h2><p className="mt-1 text-sm text-slate-400">{dayClasses.length ? `${dayClasses.length} classes from your routine` : 'A clear day — no classes scheduled.'}</p></div><div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><Clock3 /> 90 min sessions</div></div>
          <div className="flex flex-col gap-3">{dayClasses.map((item) => <article key={`${item.day}-${item.start}-${item.course}`} className={`group flex items-stretch gap-3 rounded-3xl border p-4 transition hover:-translate-y-0.5 sm:gap-5 sm:p-5 ${item.retake ? 'border-amber-300/30 bg-amber-300/[0.07]' : 'border-white/10 bg-white/[0.04] hover:border-cyan-300/20'}`}><div className="flex w-[58px] shrink-0 flex-col justify-center border-r border-white/10 pr-3 sm:w-[88px] sm:pr-5"><span className="font-mono text-sm font-semibold tabular-nums text-slate-200">{item.start}</span><span className="my-1 h-px w-4 bg-slate-600" /><span className="font-mono text-xs tabular-nums text-slate-500">{item.end}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold sm:text-lg">{item.course}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.retake ? 'bg-amber-300 text-amber-950' : 'bg-cyan-300/10 text-cyan-200'}`}>{item.retake ? 'Your retake' : `Section ${item.section}`}</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span className="inline-flex items-center gap-1.5"><MapPin /> {item.room}</span><span className="inline-flex items-center gap-1.5"><Users /> {item.teacher}</span></div></div><ChevronRight className="my-auto hidden text-slate-600 transition group-hover:translate-x-1 sm:block" /></article>)}</div>
        </section>
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-slate-500"><span>Routine V3.1 · Effective 26 September 2026</span><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400" /> Live schedule</span></footer>
      </div>
    </main>
  )
}
