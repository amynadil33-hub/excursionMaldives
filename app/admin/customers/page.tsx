import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { ActionSelect } from '@/components/admin/controls'
import { setUserRole } from '@/app/actions/admin'
import { adminDb } from '@/lib/admin'
import { formatDate } from '@/lib/format'

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'admin', label: 'Admin' },
]

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const supabase = await adminDb()
  let query = supabase.from('profiles').select('id, full_name, email, phone, country, role, created_at').order('created_at', { ascending: false })
  const term = q.trim().replace(/[%,()]/g, '').slice(0, 60)
  if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)
  const { data: users } = await query.limit(300)

  return (
    <>
      <PortalHeader
        title="Users"
        description="Customers, vendor owners and admins. Vendor roles are granted automatically when a vendor is approved."
        actions={
          <form>
            <label htmlFor="user-search" className="sr-only">
              Search users
            </label>
            <input
              id="user-search"
              name="q"
              defaultValue={q}
              placeholder="Search name or email"
              className="h-10 w-64 rounded-full border border-input bg-card px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        }
      />
      <Panel>
        {users?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {users.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{u.full_name ?? 'No name'}</p>
                  <p className="truncate text-sm text-muted-foreground">{[u.email, u.phone, u.country].filter(Boolean).join(' · ')}</p>
                </div>
                <span className="text-sm text-muted-foreground">Joined {formatDate(u.created_at)}</span>
                <ActionSelect label={`Role for ${u.email}`} value={u.role} options={ROLE_OPTIONS} action={setUserRole.bind(null, u.id)} className="w-32" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No users found.</p>
        )}
      </Panel>
    </>
  )
}
