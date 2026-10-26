import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { KeyValueForm } from '@/components/admin/forms'
import { saveMarketplaceSettings } from '@/app/actions/admin'
import { adminDb } from '@/lib/admin'
import { isBmlConfigured } from '@/lib/bml'

export default async function AdminSettings() {
  const supabase = await adminDb()
  const { data } = await supabase.from('settings').select('value').eq('key', 'marketplace').maybeSingle()
  const settings = (data?.value ?? {}) as Record<string, unknown>
  const bmlReady = isBmlConfigured()

  return (
    <>
      <PortalHeader title="Settings" description="Marketplace-wide defaults." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Marketplace">
          <KeyValueForm
            action={saveMarketplaceSettings}
            values={settings}
            submitLabel="Save settings"
            fields={[
              { name: 'site_name', label: 'Site name' },
              { name: 'default_commission', label: 'Default commission (%)', type: 'number', hint: 'Applied to newly approved vendors. Adjust per vendor on their page.' },
              { name: 'support_email', label: 'Support email' },
              { name: 'support_phone', label: 'Support phone' },
              { name: 'whatsapp', label: 'WhatsApp' },
              { name: 'address', label: 'Office address' },
            ]}
          />
        </Panel>
        <Panel title="Payments · Bank of Maldives">
          <div className="flex flex-col gap-3 text-sm leading-relaxed">
            <p className="flex items-center gap-2 font-semibold">
              <span className={`size-2.5 rounded-full ${bmlReady ? 'bg-palm' : 'bg-accent'}`} aria-hidden />
              {bmlReady ? 'BML Connect is configured' : 'BML Connect is not configured yet'}
            </p>
            <p className="text-muted-foreground">
              Payment credentials are kept as server environment variables, never in the database. Set these in the project&apos;s environment settings:
            </p>
            <ul className="flex flex-col gap-1 font-mono text-xs">
              <li>BML_API_KEY</li>
              <li>BML_APP_ID</li>
              <li>BML_API_URL</li>
              <li>BML_WEBHOOK_SECRET</li>
              <li>NEXT_PUBLIC_SITE_URL</li>
            </ul>
            <p className="text-muted-foreground">
              Until these are set, checkout runs in demo mode and orders are marked paid without charging a card, so you can test the full booking flow.
            </p>
          </div>
        </Panel>
      </div>
    </>
  )
}
