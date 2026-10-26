'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { safeNext } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function friendlyError(mode: 'login' | 'signup', err: { message: string; code?: string; status?: number }) {
  const code = err.code ?? ''
  if (code === 'email_not_confirmed') return 'Please confirm your email first — check your inbox for the link.'
  if (code === 'weak_password' || /password/i.test(err.message) && mode === 'signup') return 'Please choose a stronger password (at least 8 characters).'
  if (err.status === 429 || code.includes('rate_limit')) return 'Too many attempts. Please wait a minute and try again.'
  if (code === 'email_address_invalid') return 'Please use a valid email address.'
  if (mode === 'login' && (code === 'invalid_credentials' || err.status === 400)) return 'Invalid email or password.'
  if (mode === 'signup' && code === 'user_already_exists') return 'If this email is new, check your inbox to confirm your account.'
  return 'Something went wrong. Please try again.'
}

export function AuthForm({ mode, next, configured }: { mode: 'login' | 'signup'; next?: string; configured: boolean }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const target = safeNext(next)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!configured) return
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email')).trim()
    const password = String(fd.get('password'))
    setError(null)
    setPending(true)
    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setPending(false)
      if (error) return setError(friendlyError('login', error))
      router.push(target)
      router.refresh()
      return
    }

    if (password.length < 8) {
      setPending(false)
      return setError('Please choose a password of at least 8 characters.')
    }
    const base = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${base}?next=${encodeURIComponent(target)}`,
        data: { full_name: String(fd.get('full_name') ?? '').trim().slice(0, 120) },
      },
    })
    setPending(false)
    if (error) return setError(friendlyError('signup', error))
    router.push('/auth/sign-up-success')
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {!configured && (
        <p className="rounded-2xl bg-secondary p-4 text-sm leading-relaxed">Accounts will be available once the marketplace database is connected.</p>
      )}
      {mode === 'signup' && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" required maxLength={120} autoComplete="name" className="h-11" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" className="h-11" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="h-11" />
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending || !configured} className="h-12 rounded-full">
        {pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === 'login' ? (
          <>
            New to Excursion Maldives?{' '}
            <Link href={`/auth/sign-up?next=${encodeURIComponent(target)}`} className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href={`/auth/login?next=${encodeURIComponent(target)}`} className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  )
}
