import { SiteSettings } from '@/components/interfaces/Sites/SiteSettings'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import SiteDetailsLayout from '@/components/layouts/SitesLayout/SiteDetailsLayout'
import type { NextPageWithLayout } from '@/types'

const SiteSettingsPage: NextPageWithLayout = () => <SiteSettings />

SiteSettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <SiteDetailsLayout title="Settings">{page}</SiteDetailsLayout>
  </DefaultLayout>
)

export default SiteSettingsPage
