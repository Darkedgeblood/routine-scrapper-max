'use client'

// Accounts: sign up with a university email + password, per-account profile.

import { useCallback, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export const ALLOWED_EMAIL_DOMAIN = 'diu.edu.bd'
export const MIN_PASSWORD_LENGTH = 8
export const BIO_MAX = 160
export const NAME_MAX = 40

export type Profile = {
  display_name: string
  bio: string
  avatar_url: string | null
}

export type AuthResult = { ok: true; message?: string } | { ok: false; error: string }

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isUniversityEmail(email: string) {
  return normalizeEmail(email).endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)
}

function friendlyError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Wrong email or password.'
  if (m.includes('not confirmed')) return 'Confirm your email first. Check your inbox (and spam folder) for the link.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with this email already exists. Try signing in.'
  if (m.includes('only university emails') || m.includes('database error saving new user')) {
    return `Only university emails (@${ALLOWED_EMAIL_DOMAIN}) can sign up.`
  }
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (m.includes('same password') || m.includes('different from the old')) return 'Choose a password different from the old one.'
  if (m.includes('password') && m.includes('characters')) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  if (m.includes('fetch') || m.includes('network')) return 'Network problem. Check your connection and try again.'
  return 'Something went wrong. Please try again.'
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [recovery, setRecovery] = useState(false) // opened from a "reset password" email link
  const [profile, setProfile] = useState<Profile | null>(null)

  const user: User | null = session?.user ?? null
  const userId = user?.id ?? null

  // Track the session (also picks up the email-confirmation / password-reset links).
  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Load this account's profile.
  useEffect(() => {
    if (!supabase || !userId) {
      setProfile(null)
      return
    }
    let active = true
    supabase
      .from('profiles')
      .select('display_name, bio, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile(data ?? { display_name: '', bio: '', avatar_url: null })
      })
    return () => {
      active = false
    }
  }, [userId])

  const signUp = useCallback(async (emailInput: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: 'Accounts are not set up yet.' }
    const email = normalizeEmail(emailInput)
    if (!isUniversityEmail(email)) return { ok: false, error: `Use your university email (@${ALLOWED_EMAIL_DOMAIN}).` }
    if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) return { ok: false, error: friendlyError(error.message) }
    // With email confirmation on, an already-registered address comes back with no identities.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { ok: false, error: 'An account with this email already exists. Try signing in.' }
    }
    return { ok: true, message: `We sent a confirmation link to ${email}. Open it, then sign in.` }
  }, [])

  const signIn = useCallback(async (emailInput: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: 'Accounts are not set up yet.' }
    const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(emailInput), password })
    return error ? { ok: false, error: friendlyError(error.message) } : { ok: true }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const sendReset = useCallback(async (emailInput: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: 'Accounts are not set up yet.' }
    const email = normalizeEmail(emailInput)
    if (!isUniversityEmail(email)) return { ok: false, error: `Use your university email (@${ALLOWED_EMAIL_DOMAIN}).` }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (error) return { ok: false, error: friendlyError(error.message) }
    return { ok: true, message: `If ${email} has an account, a reset link is on its way.` }
  }, [])

  const setNewPassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: 'Accounts are not set up yet.' }
    if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { ok: false, error: friendlyError(error.message) }
    setRecovery(false)
    return { ok: true, message: 'Password updated.' }
  }, [])

  const saveProfile = useCallback(
    async (input: { display_name: string; bio: string }): Promise<AuthResult> => {
      if (!supabase || !userId) return { ok: false, error: 'Sign in first.' }
      const patch = {
        id: userId,
        display_name: input.display_name.trim().slice(0, NAME_MAX),
        bio: input.bio.trim().slice(0, BIO_MAX),
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('profiles').upsert(patch)
      if (error) return { ok: false, error: 'Could not save your profile. Please try again.' }
      setProfile((prev) => ({ avatar_url: prev?.avatar_url ?? null, display_name: patch.display_name, bio: patch.bio }))
      return { ok: true, message: 'Profile saved.' }
    },
    [userId]
  )

  const uploadAvatar = useCallback(
    async (file: File): Promise<AuthResult> => {
      if (!supabase || !userId) return { ok: false, error: 'Sign in first.' }
      if (!file.type.startsWith('image/')) return { ok: false, error: 'Choose an image file.' }
      let blob: Blob
      try {
        blob = await squareJpeg(file, 256)
      } catch {
        return { ok: false, error: 'That image could not be read. Try a different one.' }
      }
      const path = `${userId}/avatar.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' })
      if (uploadError) return { ok: false, error: 'Upload failed. Please try again.' }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?v=${Date.now()}` // bust the cache after a change
      const { error } = await supabase.from('profiles').upsert({ id: userId, avatar_url: url, updated_at: new Date().toISOString() })
      if (error) return { ok: false, error: 'Photo uploaded but could not be saved. Please try again.' }
      setProfile((prev) => ({ display_name: prev?.display_name ?? '', bio: prev?.bio ?? '', avatar_url: url }))
      return { ok: true }
    },
    [userId]
  )

  return {
    configured: isSupabaseConfigured,
    loading,
    user,
    userId,
    email: user?.email ?? null,
    profile,
    recovery,
    signUp,
    signIn,
    signOut,
    sendReset,
    setNewPassword,
    saveProfile,
    uploadAvatar,
  }
}

export type AuthState = ReturnType<typeof useAuth>

// Center-crop to a square and shrink to `size` px, so profile pictures stay tiny (~15 KB).
async function squareJpeg(file: File, size: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas')
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.85)
  })
}
