import type { RoutineItem } from '@/lib/routine-data'

const WEEKDAY_NUMBER: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function formatIcsDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`
}

function formatIcsUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function firstOccurrence(item: RoutineItem, now: Date) {
  const targetDay = WEEKDAY_NUMBER[item.day] ?? 6
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  let offset = (targetDay - date.getDay() + 7) % 7
  if (offset === 0 && item.startMinutes <= now.getHours() * 60 + now.getMinutes()) offset = 7
  date.setDate(date.getDate() + offset)
  date.setHours(Math.floor(item.startMinutes / 60), item.startMinutes % 60, 0, 0)
  return date
}

function foldLine(line: string) {
  const chunks: string[] = []
  let chunk = ''
  let bytes = 0
  for (const char of line) {
    const size = new TextEncoder().encode(char).length
    if (bytes + size > 73) {
      chunks.push(chunk)
      chunk = ` ${char}`
      bytes = size + 1
    } else {
      chunk += char
      bytes += size
    }
  }
  chunks.push(chunk)
  return chunks.join('\r\n')
}

export function downloadRoutineCalendar(items: RoutineItem[], section: string, weeks: number) {
  const stamp = formatIcsUtc(new Date())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Routine Scrapper Max//CSE Batch 69//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcs(`Routine ${section}`)}`,
    'METHOD:PUBLISH',
  ]

  for (const item of items) {
    const start = firstOccurrence(item, new Date())
    const end = new Date(start.getTime() + (item.endMinutes - item.startMinutes) * 60_000)
    const description = [
      item.courseTitle,
      `Section ${item.section}`,
      item.subSection,
      item.teacher ? `Teacher: ${item.teacher}` : null,
    ].filter(Boolean).join(' · ')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${item.id}@routine-scrapper-max`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `RRULE:FREQ=WEEKLY;COUNT=${Math.max(1, Math.min(weeks, 24))}`,
      `SUMMARY:${escapeIcs(`${item.courseCode} · ${item.courseTitle}`)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `LOCATION:${escapeIcs(item.room)}`,
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  const file = new Blob([lines.map(foldLine).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = `routine-${section.toLowerCase()}-${weeks}-weeks.ics`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

