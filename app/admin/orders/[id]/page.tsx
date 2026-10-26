import { notFound } from 'next/navigation'
import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { StatusBadge } from '@/components/site/status-badge'
import { ActionButton, ActionSelect, InlineForm } from '@/components/admin/controls'
import { adminCancelOrder, adminRecordRefund, adminSetBookingStatus } from '@/app/actions/admin'
import { adminDb, BOOKING_OPTIONS, one } from '@/lib/admin'
import { formatDate, formatPrice, formatTime } from '@/lib/format'

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await adminDb()
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()
  if (!order) notFound()

  const [{ data: bookings }, { data: payments }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, booking_date, start_time, adults, children, line_total, commission_amount, vendor_earnings, status, pickup_location, guest_notes, experience:experiences(title), vendor:vendors(business_name)')
      .eq('order_id', id),
    supabase.from('payments').select('id, provider, provider_reference, amount, status, created_at').eq('order_id', id).order('created_at'),
  ])
  const commission = (bookings ?? []).reduce((s, b) => s + Number(b.commission_amount), 0)

  return (
    <>
      <PortalHeader
        title={`Order ${order.order_number}`}
        description={`Placed ${formatDate(order.created_at)} by ${order.contact_name}`}
        actions={<StatusBadge status={order.status} />}
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Customer" className="xl:col-span-1">
          <dl className="grid gap-2 text-sm">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{order.contact_name}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>
              <a href={`mailto:${order.contact_email}`} className="text-primary hover:underline">
                {order.contact_email}
              </a>
            </dd>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{order.contact_phone ?? '—'}</dd>
            {order.notes && (
              <>
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-line">{order.notes}</dd>
              </>
            )}
          </dl>
        </Panel>
        <Panel title="Totals" className="xl:col-span-1">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="text-right">{formatPrice(order.subtotal)}</dd>
            <dt className="text-muted-foreground">Discount</dt>
            <dd className="text-right">-{formatPrice(order.discount)}</dd>
            <dt className="font-semibold">Total charged</dt>
            <dd className="text-right font-semibold">{formatPrice(order.total)}</dd>
            <dt className="text-muted-foreground">Marketplace commission</dt>
            <dd className="text-right">{formatPrice(commission)}</dd>
          </dl>
        </Panel>
        <Panel title="Actions" className="xl:col-span-1">
          {order.status === 'pending_payment' && (
            <ActionButton action={adminCancelOrder.bind(null, order.id)} confirmText="Cancel this unpaid order and release seats?" variant="destructive">
              Cancel unpaid order
            </ActionButton>
          )}
          {order.status === 'paid' && (
            <div className="flex flex-col gap-2">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Issue the refund in the BML merchant portal first, then record it here to reverse vendor earnings and free the seats.
              </p>
              <InlineForm action={adminRecordRefund.bind(null, order.id)} name="reference" label="BML refund reference" placeholder="Refund reference" submitLabel="Record refund" />
            </div>
          )}
          {!['pending_payment', 'paid'].includes(order.status) && <p className="text-sm text-muted-foreground">No actions available.</p>}
        </Panel>
      </div>
      <Panel title="Bookings">
        <ul className="flex flex-col divide-y divide-border">
          {(bookings ?? []).map((b) => (
            <li key={b.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{one(b.experience)?.title}</p>
                <p className="text-sm text-muted-foreground">
                  {one(b.vendor)?.business_name} · {formatDate(b.booking_date)} at {formatTime(b.start_time)} · {b.adults} adult{b.adults === 1 ? '' : 's'}
                  {b.children > 0 && `, ${b.children} child${b.children === 1 ? '' : 'ren'}`}
                </p>
                {b.pickup_location && <p className="text-sm text-muted-foreground">Pickup: {b.pickup_location}</p>}
              </div>
              <span className="text-sm">
                {formatPrice(b.line_total)} <span className="text-muted-foreground">(vendor {formatPrice(b.vendor_earnings)})</span>
              </span>
              {b.status === 'cancelled' ? (
                <StatusBadge status="cancelled" />
              ) : (
                <ActionSelect label="Booking status" value={b.status} options={BOOKING_OPTIONS} action={adminSetBookingStatus.bind(null, b.id)} />
              )}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Payment attempts">
        {payments?.length ? (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="uppercase text-muted-foreground">{p.provider}</span>
                <span className="flex-1 font-mono">{p.provider_reference ?? '—'}</span>
                <span className="text-muted-foreground">{formatDate(p.created_at)}</span>
                <span className="font-semibold">{formatPrice(p.amount)}</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No payment attempts recorded.</p>
        )}
      </Panel>
    </>
  )
}
