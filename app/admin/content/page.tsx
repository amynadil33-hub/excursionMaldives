import { Panel, PortalHeader } from '@/components/portal/portal-shell'
import { HomeContentForm, KeyValueForm } from '@/components/admin/forms'
import { saveAboutContent, saveContactContent, saveHomeContent } from '@/app/actions/admin'
import { requireAdmin } from '@/lib/auth'
import { getCmsSection, getHomeContent } from '@/lib/queries'

export default async function AdminContent() {
  await requireAdmin()
  const [home, about, contact] = await Promise.all([
    getHomeContent(),
    getCmsSection<Record<string, unknown>>('about', {}),
    getCmsSection<Record<string, unknown>>('contact', {}),
  ])

  return (
    <>
      <PortalHeader title="Pages & CMS" description="Edit the words and photos on the public site. Changes go live as soon as you save." />
      <Panel title="Homepage">
        <HomeContentForm content={home} action={saveHomeContent} />
      </Panel>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="About page">
          <KeyValueForm
            action={saveAboutContent}
            values={about}
            folder="about"
            submitLabel="Save About page"
            fields={[
              { name: 'title', label: 'Headline' },
              { name: 'intro', label: 'Intro', type: 'textarea' },
              { name: 'body', label: 'Story', type: 'textarea', hint: 'Separate paragraphs with a blank line.' },
              { name: 'image_url', label: 'Photo', type: 'image' },
            ]}
          />
        </Panel>
        <Panel title="Contact details">
          <KeyValueForm
            action={saveContactContent}
            values={contact}
            submitLabel="Save contact details"
            fields={[
              { name: 'email', label: 'Email' },
              { name: 'phone', label: 'Phone' },
              { name: 'whatsapp', label: 'WhatsApp' },
              { name: 'address', label: 'Address' },
              { name: 'hours', label: 'Opening hours', hint: 'e.g. Daily 8am – 8pm (MVT)' },
            ]}
          />
        </Panel>
      </div>
    </>
  )
}
