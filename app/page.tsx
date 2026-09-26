'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronRight, Clock3, MapPin, Moon, Search, Sun, Users, Zap } from 'lucide-react'

type RoutineItem = {
  id: string
  day: string
  startTime: string
  endTime: string
  courseCode: string
  courseTitle: string
  room: string
  teacher: string
  section: string
  isRetake: boolean
}

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as const
const FULL_DAYS: Record<string, string> = {
  Sat: 'Saturday', Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
}
const SECTIONS = ['69_A', '69_B', '69_C', '69_D', '69_E', '69_F', '69_G', '69_H', '69_I', '69_J', '69_K', '69_L', '69_M', '69_N', '69_O', '69_P']

// Filtered from the attached CSE routine: Batch 69 regular sections and MAT211 RE_B(3C).
const ROUTINE_DATA: RoutineItem[] = [
  { id: '1', day: 'Saturday', startTime: '08:30 AM', endTime: '10:00 AM', courseCode: 'CSE215', courseTitle: 'CSE215', room: 'KT-216', teacher: 'NUM', section: '69_M', isRetake: false },
  { id: '2', day: 'Saturday', startTime: '10:00 AM', endTime: '11:30 AM', courseCode: 'CSE221', courseTitle: 'CSE221', room: 'KT-216', teacher: 'MIZ', section: '69_K', isRetake: false },
  { id: '3', day: 'Saturday', startTime: '11:30 AM', endTime: '01:00 PM', courseCode: 'MAT211', courseTitle: 'MAT211', room: 'KT-217', teacher: 'NRM', section: 'RE_B(3C)', isRetake: true },
  { id: '4', day: 'Saturday', startTime: '02:30 PM', endTime: '04:00 PM', courseCode: 'CSE215', courseTitle: 'CSE215', room: 'KT-208', teacher: 'MNS', section: '69_K', isRetake: false },
  { id: '5', day: 'Sunday', startTime: '08:30 AM', endTime: '10:00 AM', courseCode: 'CSE221', courseTitle: 'CSE221', room: 'KT-216', teacher: 'SZ', section: '69_C', isRetake: false },
  { id: '6', day: 'Sunday', startTime: '10:00 AM', endTime: '11:30 AM', courseCode: 'CSE221', courseTitle: 'CSE221', room: 'KT-216', teacher: 'SZ', section: '69_D', isRetake: false },
  { id: '7', day: 'Sunday', startTime: '01:00 PM', endTime: '02:30 PM', courseCode: 'CSE215', courseTitle: 'CSE215', room: 'KT-510', teacher: 'MLR', section: '69_N', isRetake: false },
  { id: '8', day: 'Sunday', startTime: '02:30 PM', endTime: '04:00 PM', courseCode: 'CSE222', courseTitle: 'CSE222', room: 'G1-002', teacher: 'AUA', section: '69_E', isRetake: false },
  { id: '9', day: 'Monday', startTime: '08:30 AM', endTime: '10:00 AM', courseCode: 'CSE215', courseTitle: 'CSE215', room: 'KT-220', teacher: 'MSU', section: '69_C', isRetake: false },
  { id: '10', day: 'Monday', startTime: '10:00 AM', endTime: '11:30 AM', courseCode: 'CSE221', courseTitle: 'CSE221', room: 'KT-318(B)', teacher: 'AAA', section: '69_M', isRetake: false },
  { id: '11', day: 'Monday', startTime: '01:00 PM', endTime: '02:30 PM', courseCode: 'MAT211', courseTitle: 'MAT211', room: 'ANX1-208', teacher: 'NRM', section: 'RE_B(3C)', isRetake: true },
  { id: '12', day: 'Monday', startTime: '04:00 PM', endTime: '05:30 PM', courseCode: 'CSE216', courseTitle: 'CSE216', room: 'SH-105', teacher: 'NAB', section: '69_B', isRetake: false },
  { id: '13', day: 'Tuesday', startTime: '08:30 AM', endTime: '10:00 AM', courseCode: 'CSE222', courseTitle: 'CSE222', room: 'G1-002', teacher: 'FLA', section: '69_K', isRetake: false },
  { id: '14', day: 'Tuesday', startTime: '10:00 AM', endTime: '11:30 AM', courseCode: 'CSE215', courseTitle: 'CSE215', room: 'KT-510', teacher: 'EHL', section: '69_F', isRetake: false },
  { id: '15', day: 'Tuesday', startTime: '02:30 PM', endTime: '04:00 PM', courseCode: 'CSE221', courseTitle: 'CSE221', room: 'KT-501(A)', teacher: 'MIZ', section: '69_I', isRetake: false },
  { id: '16', day: 'Wednesday', startTime: '08:30 AM', endTime: '10:00 AM', courseCode: 'CSE215', courseTitle: 'CSE215', room: 'KT-224', teacher: 'MNS', section: '69_O', isRetake: false },
  { id: '17', day: 'Wednesday', startTime: '11:30 AM', endTime: '01:00 PM', courseCode: 'MAT211', courseTitle: 'MAT211', room: 'KT-217', teacher: 'NRM', section: 'RE_B(3C)', isRetake: true },
  { id: '18', day: 'Wednesday', startTime: '02:30 PM', endTime: '04:00 PM', courseCode: 'CSE222', courseTitle: 'CSE222', room: 'G1-012', teacher: 'SRS', section: '69_N', isRetake: false },
  { id: '19', day: 'Thursday', startTime: '10:00 AM', endTime: '11:30 AM', courseCode: 'CSE216', courseTitle: 'CSE216', room: 'KT-810', teacher: 'MSU', section: '69_C', isRetake: false },
  { id: '20', day: 'Thursday', startTime: '01:00 PM', endTime: '02:30 PM', courseCode: 'CSE222', courseTitle: 'CSE222', room: 'G1-001', teacher: 'MTN', section: '69_B', isRetake: false },
  { id: '21', day: 'Thursday', startTime: '02:30 PM', endTime: '04:00 PM', courseCode: 'CSE215', courseTitle: 'CSE215', room: 'KT-503', teacher: 'EHL', section: '69_F', isRetake: false },
]

function getToday() {
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date())
  return DAYS.includes(day as (typeof DAYS)[number]) ? day : 'Sat'
}

function timeToMinutes(value: string) {
  const [time, period] = value.split(' ')
  const [hours, minutes] = time.split(':').map(Number)
  return ((hours % 12) + (period === 'PM' ? 12 : 0)) * 60 + minutes
}

export default function Page() {
  const [selectedDay, setSelectedDay] = useState(getToday())
  const [now, setNow] = useState(new Date())
  const [dark, setDark] = useState(true)
  const [selectedSection, setSelectedSection] = useState('69_A')

  useEffect(() => {
    const savedSection = window.localStorage.getItem('routine-section')
    if (savedSection && SECTIONS.includes(savedSection)) setSelectedSection(savedSection)
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const chooseSection = (section: string) => {
    if (!SECTIONS.includes(section)) return
    setSelectedSection(section)
    window.localStorage.setItem('routine-section', section)
  }

  const dayClasses = useMemo(() => ROUTINE_DATA.filter((item) => item.day === FULL_DAYS[selectedDay] && (item.section === selectedSection || item.isRetake === true)), [selectedDay, selectedSection])
  const regularCount = dayClasses.filter((item) => !item.isRetake).length
  const retakeCount = dayClasses.filter((item) => item.isRetake).length
  const nextClass = dayClasses.find((item) => timeToMinutes(item.startTime) > now.getHours() * 60 + now.getMinutes())

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
            <div className="mt-8 flex items-end justify-between gap-4"><div><p className="font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p><p className="mt-1 text-sm text-slate-400">{now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p></div><div className="hidden text-right sm:block"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Next up</p><p className="mt-1 font-medium text-slate-200">{nextClass ? `${nextClass.courseCode} · ${nextClass.startTime} - ${nextClass.endTime}` : 'No more classes'}</p></div></div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1"><div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><Users className="text-cyan-300" /><p className="mt-5 text-3xl font-semibold">{regularCount}</p><p className="text-sm text-slate-400">regular classes</p></div><div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-5"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-300" /><p className="text-xs font-semibold uppercase tracking-widest text-amber-200">Retake</p></div><p className="mt-5 text-3xl font-semibold">{retakeCount}</p><p className="text-sm text-slate-400">MAT211 session</p></div></div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div className="mb-3 flex items-center gap-2 sm:mb-0"><Search className="text-cyan-300" /><div><p className="text-sm font-semibold">Your section</p><p className="text-xs text-slate-500">Regular classes for {selectedSection}</p></div></div>
          <div className="relative w-full sm:max-w-xs"><label htmlFor="section-select" className="sr-only">Select batch section</label><select id="section-select" value={selectedSection} onChange={(event) => chooseSection(event.target.value)} className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-medium text-slate-100 outline-none ring-cyan-300 transition focus:ring-2">{SECTIONS.map((section) => <option key={section} value={section} className="bg-slate-900">{section}</option>)}</select></div>
        </section>

        <nav aria-label="Select a day" className="mt-5 flex gap-2 overflow-x-auto pb-1">{DAYS.map((day) => <button key={day} onClick={() => setSelectedDay(day)} className={`min-w-[58px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${selectedDay === day ? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/20' : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}><span className="block text-xs opacity-60">{day === getToday() ? 'Today' : FULL_DAYS[day].slice(0, 3)}</span>{day}</button>)}</nav>

        <section className="mt-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">{FULL_DAYS[selectedDay]} schedule</h2><p className="mt-1 text-sm text-slate-400">{dayClasses.length ? `${dayClasses.length} classes from your routine` : 'A clear day — no classes scheduled.'}</p></div><div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><Clock3 /> 90 min sessions</div></div>
          <div className="flex flex-col gap-3">{dayClasses.map((item) => <article key={item.id} className={`group flex items-stretch gap-3 rounded-3xl border p-4 transition hover:-translate-y-0.5 sm:gap-5 sm:p-5 ${item.isRetake ? 'border-amber-300/30 bg-amber-300/[0.07]' : 'border-white/10 bg-white/[0.04] hover:border-cyan-300/20'}`}><div className="flex w-[58px] shrink-0 flex-col justify-center border-r border-white/10 pr-3 sm:w-[88px] sm:pr-5"><span className="font-mono text-sm font-semibold tabular-nums text-slate-200">{item.startTime}</span><span className="my-1 h-px w-4 bg-slate-600" /><span className="font-mono text-xs tabular-nums text-slate-500">{item.endTime}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold sm:text-lg">{item.courseCode}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.isRetake ? 'bg-amber-300 text-amber-950' : 'bg-cyan-300/10 text-cyan-200'}`}>{item.isRetake ? 'Your retake' : `Section ${item.section}`}</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span className="inline-flex items-center gap-1.5"><MapPin /> {item.room}</span><span className="inline-flex items-center gap-1.5"><Users /> {item.teacher}</span></div></div><ChevronRight className="my-auto hidden text-slate-600 transition group-hover:translate-x-1 sm:block" /></article>)}</div>
        </section>
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-slate-500"><span>Routine V3.1 · Effective 26 September 2026</span><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400" /> Live schedule</span></footer>
      </div>
    </main>
  )
}
