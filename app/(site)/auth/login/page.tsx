import type { Metadata } from 'next'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your bookings, wishlist and vendor listings.">
      <AuthForm mode="login" next={next} configured={isSupabaseConfigured()} />
    </AuthShell>
  )
}
