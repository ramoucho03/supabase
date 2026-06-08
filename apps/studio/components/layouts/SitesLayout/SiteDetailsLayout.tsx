import { useParams } from 'common'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ExternalLink, Globe } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, type PropsWithChildren } from 'react'
import { toast } from 'sonner'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Button,
  NavMenu,
  NavMenuItem,
} from 'ui'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { ProjectLayout } from '../ProjectLayout'
import { getSiteUrl } from '@/components/interfaces/Sites/Sites.utils'
import CopyButton from '@/components/ui/CopyButton'
import { useSiteQuery } from '@/data/sites/site-query'
import { withAuth } from '@/hooks/misc/withAuth'

dayjs.extend(relativeTime)

interface SiteDetailsLayoutProps {
  title: string
}

const SiteDetailsLayout = ({ title, children }: PropsWithChildren<SiteDetailsLayoutProps>) => {
  const router = useRouter()
  const { ref, slug } = useParams()

  const { data: site, isError, error } = useSiteQuery({ projectRef: ref, slug })

  const siteUrl = site ? getSiteUrl(site) : undefined
  const updatedRelative = site?.updated_at ? dayjs(site.updated_at).fromNow() : undefined

  const browserTitle = { entity: slug, section: title }

  const breadcrumbItems = [
    { label: 'Sites', href: `/project/${ref}/sites` },
    { label: slug, href: `/project/${ref}/sites/${slug}` },
  ]

  const navigationItems = slug
    ? [
        { label: 'Overview', href: `/project/${ref}/sites/${slug}` },
        { label: 'Files', href: `/project/${ref}/sites/${slug}/files` },
        { label: 'Settings', href: `/project/${ref}/sites/${slug}/settings` },
      ]
    : []

  // Mirror the edge functions layout: bounce to the list when the site is gone.
  useEffect(() => {
    if (!!slug && isError && (error as { code?: number })?.code === 404) {
      toast('This site could not be found in your project')
      router.push(`/project/${ref}/sites`)
    }
  }, [isError])

  return (
    <ProjectLayout product="Sites" browserTitle={browserTitle} isBlocking={false}>
      <div className="w-full min-h-full flex flex-col items-stretch">
        <PageHeader size="full" className="sticky top-0 z-10 bg-surface-75">
          <PageHeaderBreadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((item, index) => (
                <React.Fragment key={item.label || `breadcrumb-${index}`}>
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </PageHeaderBreadcrumb>

          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle className="flex items-center gap-2">
                <Globe size={20} strokeWidth={1.5} className="text-foreground-light" />
                {slug}
              </PageHeaderTitle>
              <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-sm!">
                {siteUrl && (
                  <div className="flex items-center gap-x-1">
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-foreground-light hover:text-foreground"
                    >
                      {site?.domain}
                      <ExternalLink size={12} />
                    </a>
                    <CopyButton iconOnly type="text" text={siteUrl} />
                  </div>
                )}
                {updatedRelative && (
                  <span className="text-foreground-lighter">Updated {updatedRelative}</span>
                )}
              </PageHeaderDescription>
            </PageHeaderSummary>

            <PageHeaderAside>
              {siteUrl && (
                <Button asChild type="default" icon={<ExternalLink />}>
                  <a href={siteUrl} target="_blank" rel="noreferrer">
                    Visit site
                  </a>
                </Button>
              )}
            </PageHeaderAside>
          </PageHeaderMeta>

          {navigationItems.length > 0 && (
            <PageHeaderNavigationTabs>
              <NavMenu>
                {navigationItems.map((item) => {
                  const isActive = router.asPath.split('?')[0] === item.href
                  return (
                    <NavMenuItem key={item.label} active={isActive}>
                      <Link href={item.href}>{item.label}</Link>
                    </NavMenuItem>
                  )
                })}
              </NavMenu>
            </PageHeaderNavigationTabs>
          )}
        </PageHeader>

        {children}
      </div>
    </ProjectLayout>
  )
}

export default withAuth(SiteDetailsLayout)
