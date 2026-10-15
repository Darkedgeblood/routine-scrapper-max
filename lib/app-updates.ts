import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const UPDATE_NOTIFICATION_ID = 9_100_001
const UPDATE_CHANNEL_ID = 'app-updates'
const LAST_NOTIFIED_KEY = 'routine-last-notified-apk'

export type AppUpdate = {
  build: number
  tag: string
  apkUrl: string
  critical: boolean
  releaseNotes: string
}

async function getLatestRelease(): Promise<AppUpdate | null> {
  const response = await fetch('/api/app-update', { cache: 'no-store' })
  if (!response.ok) throw new Error(`Release check returned ${response.status}.`)
  const result = await response.json() as { update: AppUpdate | null }
  return result.update
}

export async function checkForAppUpdate(): Promise<AppUpdate | null> {
  if (!Capacitor.isNativePlatform()) return null
  const [installed, latest] = await Promise.all([App.getInfo(), getLatestRelease()])
  const installedBuild = Number(installed.build)
  return latest && Number.isSafeInteger(installedBuild) && latest.build > installedBuild ? latest : null
}

export async function startApkUpdate(apkUrl: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: apkUrl })
    return
  }
  window.open(apkUrl, '_blank', 'noopener,noreferrer')
}

async function notifyAboutUpdate(update: AppUpdate) {
  const previousTag = window.localStorage.getItem(LAST_NOTIFIED_KEY)
  if (previousTag === update.tag) return

  const permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') return

  await LocalNotifications.createChannel({ id: UPDATE_CHANNEL_ID, name: 'App updates', importance: 4 })
  await LocalNotifications.schedule({
    notifications: [{
      id: UPDATE_NOTIFICATION_ID,
      title: update.critical ? 'Important app update available' : 'Routine Scrapper Max update available',
      body: update.critical
        ? 'An important update is ready. Tap to download and install it.'
        : 'A new version is ready. Tap to download and install it.',
      schedule: { at: new Date(Date.now() + 2_000), allowWhileIdle: true },
      channelId: UPDATE_CHANNEL_ID,
      extra: { type: 'app-update', apkUrl: update.apkUrl },
    }],
  })
  window.localStorage.setItem(LAST_NOTIFIED_KEY, update.tag)
}

export function monitorAppUpdates(onUpdate: (update: AppUpdate | null) => void) {
  if (!Capacitor.isNativePlatform()) return () => {}
  let stopped = false
  let lastChecked = 0

  const check = async () => {
    if (stopped || Date.now() - lastChecked < 30_000) return
    lastChecked = Date.now()
    try {
      const update = await checkForAppUpdate()
      if (stopped) return
      onUpdate(update)
      if (update) await notifyAboutUpdate(update)
    } catch (error) {
      console.warn('Could not check for an app update.', error)
    }
  }

  const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void check()
  })
  const notificationListener = LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
    if (notification.id !== UPDATE_NOTIFICATION_ID || notification.extra?.type !== 'app-update') return
    const apkUrl = notification.extra?.apkUrl
    if (typeof apkUrl === 'string') void startApkUpdate(apkUrl)
  })

  void check()
  return () => {
    stopped = true
    void appStateListener.then((listener) => listener.remove())
    void notificationListener.then((listener) => listener.remove())
  }
}
