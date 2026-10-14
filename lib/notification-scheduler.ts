import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Reminder } from '@/lib/reminders'
import type { RoutineItem } from '@/lib/routine-data'

let browserTimers: ReturnType<typeof setTimeout>[] = []
const CHANNEL_ID = 'routine-alerts'

function idFor(value: string, offset = 1) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619)
  return offset + ((hash >>> 0) % 1_000_000)
}

function nextClassAlarm(item: RoutineItem, leadMinutes: number, weekOffset: number, now: Date) {
  const weekday: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  let offset = ((weekday[item.day] ?? 6) - date.getDay() + 7) % 7
  const alarmMinutes = item.startMinutes - leadMinutes
  if (offset === 0 && alarmMinutes <= now.getHours() * 60 + now.getMinutes()) offset = 7
  date.setDate(date.getDate() + offset + weekOffset * 7)
  date.setMinutes(alarmMinutes)
  return date
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function browserNotify(title: string, body: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  void navigator.serviceWorker?.getRegistration().then((registration) => {
    if (registration?.showNotification) return registration.showNotification(title, { body, icon: '/app-icon.png', badge: '/icon-192.png' })
    new Notification(title, { body, icon: '/app-icon.png' })
  }).catch(() => {
    try { new Notification(title, { body, icon: '/app-icon.png' }) } catch { /* unsupported browser */ }
  })
}

export async function requestNotificationPermission() {
  if (Capacitor.isNativePlatform()) {
    const current = await LocalNotifications.checkPermissions()
    const permission = current.display === 'granted' ? current : await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return false
    const enabled = await LocalNotifications.areEnabled()
    return enabled.value
  }
  if (typeof Notification === 'undefined') return false
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  return permission === 'granted'
}

export async function sendTestNotification() {
  const title = 'Routine notifications are on'
  const body = 'Your phone can now show local reminders.'

  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.createChannel({ id: CHANNEL_ID, name: 'Routine reminders', importance: 4 })
    await LocalNotifications.schedule({
      notifications: [{
        id: 2_000_001,
        title,
        body,
        schedule: { at: new Date(Date.now() + 5_000), allowWhileIdle: true, isExactNotification: false },
        channelId: CHANNEL_ID,
      }],
    })
    return
  }

  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    throw new Error('Notifications are not permitted.')
  }
  browserTimers.push(setTimeout(() => browserNotify(title, body), 5_000))
}

async function clearNativeNotifications() {
  try {
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map(({ id }) => ({ id })) })
  } catch {
    // A revoked OS permission should not stop the timetable from working.
  }
}

export async function clearScheduledNotifications() {
  browserTimers.forEach(clearTimeout)
  browserTimers = []
  if (Capacitor.isNativePlatform()) await clearNativeNotifications()
}

export async function syncScheduledNotifications({
  enabled,
  classes,
  reminders,
  leadMinutes,
  holidayDates = [],
}: {
  enabled: boolean
  classes: RoutineItem[]
  reminders: Reminder[]
  leadMinutes: number
  holidayDates?: string[]
}): Promise<number> {
  browserTimers.forEach(clearTimeout)
  browserTimers = []
  if (Capacitor.isNativePlatform()) await clearNativeNotifications()
  if (!enabled) return 0

  const now = new Date()
  const holidayDateSet = new Set(holidayDates)
  const scheduled: { id: number; title: string; body: string; at: Date }[] = []
  for (const item of classes) {
    for (let week = 0; week < 6; week++) {
      const at = nextClassAlarm(item, leadMinutes, week, now)
      if (at > now && !holidayDateSet.has(localDateKey(at))) scheduled.push({
        id: idFor(`class|${item.id}|${at.toISOString()}`),
        title: `Class soon · ${item.courseCode}`,
        body: `${item.startTime} · ${item.room}${item.subSection ? ` · ${item.subSection}` : ''}`,
        at,
      })
    }
  }
  for (const reminder of reminders) {
    if (reminder.done) continue
    const [year, month, day] = reminder.date.split('-').map(Number)
    const at = new Date(year, month - 1, day, 9, 0, 0, 0)
    if (at <= now) continue
    scheduled.push({
      id: idFor(`reminder|${reminder.id}`, 1_000_000),
      title: `${reminder.type[0].toUpperCase()}${reminder.type.slice(1)} due today`,
      body: reminder.course || reminder.note || 'Open Routine Scrapper Max to see details.',
      at,
    })
  }

  const unique = [...new Map(scheduled.map((item) => [item.id, item])).values()]
  if (Capacitor.isNativePlatform()) {
    if (unique.length === 0) return
    try {
      await LocalNotifications.createChannel({ id: CHANNEL_ID, name: 'Routine reminders', importance: 4 })
      const result = await LocalNotifications.schedule({
        notifications: unique.map(({ id, title, body, at }) => ({
          id,
          title,
          body,
          schedule: { at, allowWhileIdle: true, isExactNotification: false },
          channelId: CHANNEL_ID,
        })),
      })
      return result.notifications.length
    } catch (error) {
      throw error instanceof Error ? error : new Error('Native notification scheduling failed.')
    }
  }

  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return 0
  const maxDelay = 2_147_000_000
  for (const item of unique) {
    const delay = item.at.getTime() - Date.now()
    if (delay < 0 || delay > maxDelay) continue
    browserTimers.push(setTimeout(() => browserNotify(item.title, item.body), delay))
  }
  return browserTimers.length
}

