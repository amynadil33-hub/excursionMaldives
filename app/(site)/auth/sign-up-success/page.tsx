import type { Metadata } from 'next'
import { MailCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata: Metadata = { title: 'Check your email' }

export default function SignUpSuccessPage() {
  return (
    <AuthShell title="Check your inbox">
      <div className="flex flex-col gap-3 rounded-3xl bg-secondary p-6">
        <MailCheck className="size-8 text-primary" aria-hidden />
        <p className="leading-relaxed">We&apos;ve sent you a confirmation link. Open it to activate your account, then you can start booking.</p>
      </div>
    </AuthShell>
  )
}
