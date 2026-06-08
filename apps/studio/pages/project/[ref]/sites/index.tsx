import { useParams } from 'common'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { CreateSiteSheet } from '@/components/interfaces/Sites/CreateSiteSheet'
import { SitesList } from '@/components/interfaces/Sites/SitesList'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import SitesLayout from '@/components/layouts/SitesLayout/SitesLayout'
import type { NextPageWithLayout } from '@/types'

const SitesPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="w-full min-h-full flex flex-col items-stretch">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Sites</PageHeaderTitle>
            <PageHeaderDescription>
              Host static and single-page front-ends on the built-in web server
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <Button icon={<Plus />} onClick={() => setShowCreate(true)}>
              New site
            </Button>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <SitesList projectRef={ref} onCreate={() => setShowCreate(true)} />
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <CreateSiteSheet projectRef={ref} visible={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}

SitesPage.getLayout = (page) => (
  <DefaultLayout>
    <SitesLayout title="Sites">{page}</SitesLayout>
  </DefaultLayout>
)

export default SitesPage
