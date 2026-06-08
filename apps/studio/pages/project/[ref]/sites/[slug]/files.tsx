import { SiteFilesExplorer } from '@/components/interfaces/Sites/SiteFilesExplorer'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import SiteDetailsLayout from '@/components/layouts/SitesLayout/SiteDetailsLayout'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import type { NextPageWithLayout } from '@/types'

const SiteFilesPage: NextPageWithLayout = () => (
  <PageContainer size="large">
    <PageSection>
      <PageSectionContent>
        <SiteFilesExplorer />
      </PageSectionContent>
    </PageSection>
  </PageContainer>
)

SiteFilesPage.getLayout = (page) => (
  <DefaultLayout>
    <SiteDetailsLayout title="Files">{page}</SiteDetailsLayout>
  </DefaultLayout>
)

export default SiteFilesPage
