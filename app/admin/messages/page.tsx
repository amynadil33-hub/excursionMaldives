import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { ActionButton } from '@/components/admin/controls'
import { deleteRow, setMessageRead } from '@/app/actions/admin'
import { adminDb } from '@/lib/admin'
import { formatDate } from '@/lib/format'

export default async function AdminMessages() {
  const supabase = await adminDb()
  const { data: messages } = await supabase
    .from('contact_messages')
    .select('id, name, email, subject, message, kind, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <>
      <PortalHeader title="Inbox" description="Contact form messages and private trip requests." />
      <Panel>
        {messages?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {messages.map((m) => (
              <li key={m.id} className={`flex flex-col gap-3 py-4 md:flex-row ${m.is_read ? 'opacity-70' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!m.is_read && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
                    <span className="font-semibold">{m.subject ?? (m.kind === 'private_trip' ? 'Private trip request' : 'Message')}</span>
                    {m.kind === 'private_trip' && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent-foreground">Private trip</span>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{m.message}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {m.name} ·{' '}
                    <a href={`mailto:${m.email}`} className="text-primary hover:underline">
                      {m.email}
                    </a>{' '}
                    · {formatDate(m.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ActionButton action={setMessageRead.bind(null, m.id, !m.is_read)}>{m.is_read ? 'Mark unread' : 'Mark read'}</ActionButton>
                  <ActionButton action={deleteRow.bind(null, 'contact_messages', m.id)} confirmText="Delete this message?" variant="ghost">
                    Delete
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Inbox is empty.</p>
        )}
      </Panel>
    </>
  )
}
