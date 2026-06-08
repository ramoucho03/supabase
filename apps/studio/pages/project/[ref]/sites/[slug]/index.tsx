import { SiteOverview } from '@/components/interfaces/Sites/SiteOverview'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import SiteDetailsLayout from '@/components/layouts/SitesLayout/SiteDetailsLayout'
import type { NextPageWithLayout } from '@/types'

const SiteOverviewPage: NextPageWithLayout = () => <SiteOverview />

SiteOverviewPage.getLayout = (page) => (
  <DefaultLayout>
    <SiteDetailsLayout title="Overview">{page}</SiteDetailsLayout>
  </DefaultLayout>
)

export default SiteOverviewPage
