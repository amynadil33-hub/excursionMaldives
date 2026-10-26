import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata: Metadata = { title: 'Sign-in problem' }

export default function AuthErrorPage() {
  return (
    <AuthShell title="That link didn’t work" subtitle="The confirmation link may have expired or already been used.">
      <Link href="/auth/login" className="font-semibold text-primary hover:underline">
        Back to sign in
      </Link>
    </AuthShell>
  )
}
