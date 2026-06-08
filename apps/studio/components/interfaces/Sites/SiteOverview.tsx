import { useParams } from 'common'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Badge, Button, Card } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import AlertError from '@/components/ui/AlertError'
import { useSiteFilesQuery } from '@/data/sites/site-files-query'
import { useSiteQuery } from '@/data/sites/site-query'
import { DeploySiteSection } from './DeploySiteSection'
import { formatBytes, getSiteUrl, TLS_LABELS } from './Sites.utils'

dayjs.extend(relativeTime)

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Card className="p-4 flex flex-col gap-1">
    <span className="text-xs uppercase tracking-wide text-foreground-lighter">{label}</span>
    <span className="text-lg text-foreground">{value}</span>
  </Card>
)

const ConfigRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-control last:border-b-0">
    <span className="text-sm text-foreground-light">{label}</span>
    <span className="text-sm text-foreground text-right">{children}</span>
  </div>
)

export const SiteOverview = () => {
  const router = useRouter()
  const { ref, slug } = useParams()

  const { data: site, isError, error } = useSiteQuery({ projectRef: ref, slug })
  const { data: files } = useSiteFilesQuery({ projectRef: ref, slug })

  const fileCount = files?.length ?? 0
  const totalSize = (files ?? []).reduce((sum, file) => sum + file.size, 0)
  const lastUpdated = site?.updated_at ? dayjs(site.updated_at).fromNow() : '—'

  if (isError) {
    return (
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <AlertError error={error} subject="Failed to load site" />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionContent>
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat label="Files" value={fileCount} />
              <Stat label="Total size" value={formatBytes(totalSize)} />
              <Stat label="Last updated" value={lastUpdated} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <DeploySiteSection
                projectRef={ref}
                slug={slug}
                onDeployed={() => router.push(`/project/${ref}/sites/${slug}/files`)}
              />

              <Card className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base text-foreground">Configuration</h3>
                  <Button asChild type="text" iconRight={<ArrowRight size={14} />}>
                    <Link href={`/project/${ref}/sites/${slug}/settings`}>Edit</Link>
                  </Button>
                </div>
                <div>
                  <ConfigRow label="Domain">
                    {site ? (
                      <a
                        href={getSiteUrl(site)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground-light"
                      >
                        {site.domain}
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      '—'
                    )}
                  </ConfigRow>
                  <ConfigRow label="TLS">
                    {site ? (
                      <Badge variant={site.tls === 'off' ? 'default' : 'success'}>
                        {TLS_LABELS[site.tls]}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </ConfigRow>
                  <ConfigRow label="Routing">
                    <Badge variant="default">
                      {site?.spaFallback ? 'Single-page app' : 'Static files'}
                    </Badge>
                  </ConfigRow>
                  <ConfigRow label="API proxy">
                    {site?.apiProxy ? (
                      <Badge variant="success">Enabled</Badge>
                    ) : (
                      <span className="text-foreground-light">Disabled</span>
                    )}
                  </ConfigRow>
                  <ConfigRow label="Document root">
                    <code className="text-code-inline">{site?.docroot ?? slug}</code>
                  </ConfigRow>
                </div>
              </Card>
            </div>
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
