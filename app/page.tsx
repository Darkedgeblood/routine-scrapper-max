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
  subSection?: string
  isRetake: boolean
  isNotTaken: boolean
}

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as const
const FULL_DAYS: Record<string, string> = {
  Sat: 'Saturday', Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
}
const SECTIONS = ['69_A', '69_B', '69_C', '69_D', '69_E', '69_F', '69_G', '69_H', '69_I', '69_J', '69_K', '69_L', '69_M', '69_N', '69_O', '69_P']

const ROUTINE_DATA: RoutineItem[] = [
  { id: 'p-sun-1', day: 'Sunday', startTime: '08:30 AM', endTime: '10:00 AM', courseCode: 'AOL101', courseTitle: 'Art of Living', section: '69_P', teacher: 'TBA', room: 'KT-217', isRetake: false, isNotTaken: true },
  { id: 'p-sun-2', day: 'Sunday', startTime: '11:30 AM', endTime: '02:30 PM', courseCode: 'CSE216', courseTitle: 'Electronic Devices and Circuits Lab', section: '69_P', subSection: '69_P1', teacher: 'SRRS', room: 'SH-105 (E.C. & B.E. Lab)', isRetake: false, isNotTaken: false },
  { id: 'p-sun-3', day: 'Sunday', startTime: '02:30 PM', endTime: '04:00 PM', courseCode: 'CSE221', courseTitle: 'Object Oriented Programming', section: '69_P', teacher: 'SRS', room: 'G1-027', isRetake: false, isNotTaken: false },
  { id: 'p-sun-4', day: 'Sunday', startTime: '04:00 PM', endTime: '05:30 PM', courseCode: 'AOL101', courseTitle: 'Art of Living', section: '69_P', teacher: 'TBA', room: 'KT-224', isRetake: false, isNotTaken: true },
  { id: 'p-tue-1', day: 'Tuesday', startTime: '11:30 AM', endTime: '02:30 PM', courseCode: 'CSE222', courseTitle: 'Object Oriented Programming Lab', section: '69_P', subSection: '69_P2', teacher: 'SRS', room: 'G1-013 (COM LAB)', isRetake: false, isNotTaken: false },
  { id: 'p-tue-2', day: 'Tuesday', startTime: '04:00 PM', endTime: '05:30 PM', courseCode: 'CSE221', courseTitle: 'Object Oriented Programming', section: '69_P', teacher: 'SRS', room: 'KT-220', isRetake: false, isNotTaken: false },
  { id: 'p-wed-1', day: 'Wednesday', startTime: '11:30 AM', endTime: '02:30 PM', courseCode: 'CSE222', courseTitle: 'Object Oriented Programming Lab', section: '69_P', subSection: '69_P1', teacher: 'SRS', room: 'G1-002 (COM LAB)', isRetake: false, isNotTaken: false },
  { id: 'p-wed-2', day: 'Wednesday', startTime: '04:00 PM', endTime: '05:30 PM', courseCode: 'CSE215', courseTitle: 'Electronic Devices and Circuits', section: '69_P', teacher: 'SRRS', room: 'KT-306', isRetake: false, isNotTaken: false },
  { id: 'p-thu-1', day: 'Thursday', startTime: '08:30 AM', endTime: '11:30 AM', courseCode: 'CSE216', courseTitle: 'Electronic Devices and Circuits Lab', section: '69_P', subSection: '69_P2', teacher: 'SRRS', room: 'KT-809 (E.C. & D.E. Lab)', isRetake: false, isNotTaken: false },
  { id: 'p-thu-2', day: 'Thursday', startTime: '11:30 AM', endTime: '01:00 PM', courseCode: 'CSE215', courseTitle: 'Electronic Devices and Circuits', section: '69_P', teacher: 'SRRS', room: 'KT-220', isRetake: false, isNotTaken: false },
  { id: 'retake-mat211', day: 'Saturday', startTime: '11:30 AM', endTime: '01:00 PM', courseCode: 'MAT211', courseTitle: 'Engineering Mathematics', section: 'RE_B(3C)', teacher: 'NRM', room: 'KT-217', isRetake: true, isNotTaken: false },
]

function getToday(date = new Date()) {
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
  return DAYS.includes(day as (typeof DAYS)[number]) ? day : 'Sat'
}

function timeToMinutes(value: string) {
  const [time, period] = value.split(' ')
  const [hours, minutes] = time.split(':').map(Number)
  return ((hours % 12) + (period === 'PM' ? 12 : 0)) * 60 + minutes
}

export default function Page() {
  const [selectedDay, setSelectedDay] = useState<(typeof DAYS)[number]>('Sat')
  const [now, setNow] = useState<Date | null>(null)
  const [dark, setDark] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedSection, setSelectedSection] = useState('69_P')

  useEffect(() => {
    setNow(new Date())
    const today = getToday() as (typeof DAYS)[number]
    setSelectedDay(today)
    window.localStorage.setItem('routine-day', today)
    
    const savedSection = window.localStorage.getItem('routine-section')
    if (savedSection && SECTIONS.includes(savedSection)) setSelectedSection(savedSection)
    
    setIsMounted(true)
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const chooseSection = (section: string) => {
    if (!SECTIONS.includes(section)) return
    setSelectedSection(section)
    window.localStorage.setItem('routine-section', section)
  }

  const dayClasses = useMemo(() => ROUTINE_DATA.filter((item) => item.day === FULL_DAYS[selectedDay] && (item.section === selectedSection || item.isRetake === true)), [selectedDay, selectedSection])
  const regularCount = dayClasses.filter((item) => !item.isRetake && !item.isNotTaken).length
  const retakeCount = dayClasses.filter((item) => item.isRetake).length
  const currentMinutes = now ? now.getHours() * 60 + now.getMinutes() : -1
  const nextClass = dayClasses.find((item) => timeToMinutes(item.startTime) > currentMinutes)

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
            <div className="mt-8 flex items-end justify-between gap-4"><div><p className="font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{isMounted && now ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '12:00 AM'}</p><p className="mt-1 text-sm text-slate-400">{isMounted && now ? now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Loading date…'}</p></div><div className="hidden text-right sm:block"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Next up</p><p className="mt-1 font-medium text-slate-200">{nextClass ? `${nextClass.courseCode} · ${nextClass.startTime} - ${nextClass.endTime}` : 'No more classes'}</p></div></div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1"><div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><Users className="text-cyan-300" /><p className="mt-5 text-3xl font-semibold">{regularCount}</p><p className="text-sm text-slate-400">regular classes</p></div><div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-5"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-300" /><p className="text-xs font-semibold uppercase tracking-widest text-amber-200">Retake</p></div><p className="mt-5 text-3xl font-semibold">{retakeCount}</p><p className="text-sm text-slate-400">MAT211 session</p></div></div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div className="mb-3 flex items-center gap-2 sm:mb-0"><Search className="text-cyan-300" /><div><p className="text-sm font-semibold">Your section</p><p className="text-xs text-slate-500">Regular classes for {selectedSection}</p></div></div>
          <div className="relative w-full sm:max-w-xs"><label htmlFor="section-select" className="sr-only">Select batch section</label><select id="section-select" value={selectedSection} onChange={(event) => chooseSection(event.target.value)} className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-medium text-slate-100 outline-none ring-cyan-300 transition focus:ring-2">{SECTIONS.map((section) => <option key={section} value={section} className="bg-slate-900">{section}</option>)}</select></div>
        </section>

        <nav aria-label="Select a day" className="mt-5 flex gap-2 overflow-x-auto pb-1">{DAYS.map((day) => <button key={day} onClick={() => setSelectedDay(day)} className={`min-w-[58px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${selectedDay === day ? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/20' : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}><span className="block text-xs opacity-60">{isMounted && day === getToday(now ?? undefined) ? 'Today' : FULL_DAYS[day].slice(0, 3)}</span>{day}</button>)}</nav>

        <section className="mt-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">{FULL_DAYS[selectedDay]} schedule</h2><p className="mt-1 text-sm text-slate-400">{dayClasses.length ? `${dayClasses.length} classes from your routine` : 'A clear day — no classes scheduled.'}</p></div><div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><Clock3 /> 90 min sessions</div></div>
          <div className="flex flex-col gap-3">{dayClasses.map((item) => { const inactive = item.isNotTaken || item.courseCode === 'AOL101'; return <article key={item.id} className={`group flex items-stretch gap-3 rounded-3xl border p-4 transition hover:-translate-y-0.5 sm:gap-5 sm:p-5 ${inactive ? 'border-white/10 bg-white/[0.02] opacity-50 grayscale' : item.isRetake ? 'border-amber-300/30 bg-amber-300/[0.07]' : 'border-white/10 bg-white/[0.04] hover:border-cyan-300/20'}`}><div className="flex w-[58px] shrink-0 flex-col justify-center border-r border-white/10 pr-3 sm:w-[88px] sm:pr-5"><span className="font-mono text-sm font-semibold tabular-nums text-slate-200">{item.startTime}</span><span className="my-1 h-px w-4 bg-slate-600" /><span className="font-mono text-xs tabular-nums text-slate-500">{item.endTime}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className={`text-base font-semibold sm:text-lg ${inactive ? 'line-through' : ''}`}>{item.courseCode}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${inactive ? 'bg-slate-500/20 text-slate-400' : item.isRetake ? 'bg-amber-300 text-amber-950' : 'bg-cyan-300/10 text-cyan-200'}`}>{inactive ? 'Not registered' : item.isRetake ? 'Retake' : `Section ${item.section}`}</span>{item.subSection && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-400">{item.subSection}</span>}</div><p className={`mt-1 text-sm ${inactive ? 'line-through text-slate-500' : 'text-slate-300'}`}>{item.courseTitle}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span className="inline-flex items-center gap-1.5"><MapPin /> {item.room}</span><span className="inline-flex items-center gap-1.5"><Users /> {item.teacher}</span></div></div><ChevronRight className="my-auto hidden text-slate-600 transition group-hover:translate-x-1 sm:block" /></article>})}</div>
        </section>
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-slate-500"><span>Routine V3.1 · Effective 26 September 2026</span><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400" /> Live schedule</span></footer>
      </div>
    </main>
  )
}
