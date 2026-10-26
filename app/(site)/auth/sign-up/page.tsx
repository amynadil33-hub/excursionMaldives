import type { Metadata } from 'next'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = { title: 'Create an account' }

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <AuthShell title="Create your account" subtitle="Book island trips in a few taps and keep every booking in one place.">
      <AuthForm mode="signup" next={next} configured={isSupabaseConfigured()} />
    </AuthShell>
  )
}
