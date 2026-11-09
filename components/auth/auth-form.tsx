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

function unexpectedError(error: unknown) {
  if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
    return 'Could not reach the account service. Check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}

export function AuthForm({ mode, next, configured }: { mode: 'login' | 'signup'; next?: string; configured: boolean }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [googlePending, setGooglePending] = useState(false)
  const target = safeNext(next)

  async function signInWithGoogle() {
    setError(null)
    if (!configured) {
      setError('Account sign-in is not configured on this deployment. Please contact the site administrator.')
      return
    }

    setGooglePending(true)
    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', target)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() },
      })
      if (error) {
        setError('Google sign-in could not be started. Please try again.')
        setGooglePending(false)
      }
    } catch (error) {
      setError(unexpectedError(error))
      setGooglePending(false)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!configured) {
      setError('Account creation is not configured on this deployment. Please contact the site administrator.')
      return
    }
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email')).trim()
    const password = String(fd.get('password'))

    if (mode === 'signup' && password.length < 8) {
      return setError('Please choose a password of at least 8 characters.')
    }

    setPending(true)
    try {
      const supabase = createClient()

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return setError(friendlyError('login', error))
        router.push(target)
        router.refresh()
        return
      }

      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', target)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          data: { full_name: String(fd.get('full_name') ?? '').trim().slice(0, 120) },
        },
      })
      if (error) return setError(friendlyError('signup', error))
      router.push('/auth/sign-up-success')
    } catch (error) {
      setError(unexpectedError(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {!configured && (
        <p className="rounded-2xl bg-secondary p-4 text-sm leading-relaxed">Accounts will be available once the marketplace database is connected.</p>
      )}
      <Button
        type="button"
        size="lg"
        variant="outline"
        disabled={pending || googlePending || !configured}
        onClick={signInWithGoogle}
        className="h-12 rounded-full"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.39 13.87A6.02 6.02 0 0 1 6.07 12c0-.65.11-1.28.32-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.49l3.35-2.62Z" />
          <path fill="#EA4335" d="M12 6.01c1.47 0 2.79.51 3.83 1.5L18.7 4.64A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" />
        </svg>
        {googlePending ? 'Connecting to Google…' : 'Continue with Google'}
      </Button>
      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span>or use email</span>
        <span className="h-px flex-1 bg-border" />
      </div>
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
      <Button type="submit" size="lg" disabled={pending || googlePending} className="h-12 rounded-full">
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
