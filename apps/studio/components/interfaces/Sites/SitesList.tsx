import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ExternalLink, FileCode, Globe, MoreVertical, Plus, Settings, Trash2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import AlertError from '@/components/ui/AlertError'
import { useSiteDeleteMutation } from '@/data/sites/site-delete-mutation'
import { useSitesQuery } from '@/data/sites/sites-query'
import type { Site } from '@/lib/api/self-hosted/hosting/types'
import { getSiteUrl, TLS_LABELS } from './Sites.utils'

dayjs.extend(relativeTime)

interface SitesListProps {
  projectRef?: string
  onCreate: () => void
}

export const SitesList = ({ projectRef, onCreate }: SitesListProps) => {
  const router = useRouter()
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null)

  const { data: sites, error, isPending, isError, isSuccess } = useSitesQuery({ projectRef })

  const { mutate: deleteSite, isPending: isDeleting } = useSiteDeleteMutation({
    onSuccess: () => {
      toast.success(`Site “${siteToDelete?.slug}” deleted`)
      setSiteToDelete(null)
    },
  })

  const openSite = (slug: string) => router.push(`/project/${projectRef}/sites/${slug}`)

  if (isPending) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="Failed to retrieve sites" />

  return (
    <>
      {isSuccess && (sites ?? []).length === 0 ? (
        <Admonition
          type="default"
          title="Host your first site"
          description="Serve a static or single-page front-end from the built-in nginx web server, with an optional same-origin Supabase backend. Upload a build folder or a .zip and it goes live."
        >
          <Button className="mt-2" icon={<Plus />} onClick={onCreate}>
            New site
          </Button>
        </Admonition>
      ) : (
        <div className="flex flex-col gap-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>TLS</TableHead>
                  <TableHead>Routing</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sites ?? []).map((site) => (
                  <TableRow
                    key={site.id}
                    className="cursor-pointer"
                    onClick={() => openSite(site.slug)}
                  >
                    <TableCell>
                      <span className="flex items-center gap-2 text-foreground">
                        <Globe size={14} strokeWidth={1.5} className="text-foreground-light" />
                        {site.slug}
                      </span>
                    </TableCell>
                    <TableCell>
                      <a
                        href={getSiteUrl(site)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-foreground-light hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {site.domain}
                        <ExternalLink size={12} />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={site.tls === 'off' ? 'default' : 'success'}>
                        {TLS_LABELS[site.tls]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="default">{site.spaFallback ? 'SPA' : 'Static'}</Badge>
                        {site.apiProxy && <Badge variant="default">API proxy</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground-light whitespace-nowrap">
                      {site.updated_at ? dayjs(site.updated_at).fromNow() : '—'}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="text" className="px-1.5" icon={<MoreVertical />} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => openSite(site.slug)}
                          >
                            <FileCode size={14} />
                            Manage files
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() =>
                              router.push(`/project/${projectRef}/sites/${site.slug}/settings`)
                            }
                          >
                            <Settings size={14} />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => window.open(getSiteUrl(site), '_blank')}
                          >
                            <ExternalLink size={14} />
                            Visit site
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => setSiteToDelete(site)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      <ConfirmationModal
        variant="destructive"
        visible={!!siteToDelete}
        loading={isDeleting}
        title={`Delete site “${siteToDelete?.slug}”`}
        confirmLabel="Delete site"
        confirmLabelLoading="Deleting"
        onCancel={() => setSiteToDelete(null)}
        onConfirm={() => {
          if (projectRef && siteToDelete) {
            deleteSite({ projectRef, slug: siteToDelete.slug })
          }
        }}
      >
        <p className="text-sm text-foreground-light">
          This removes the nginx server block and deletes the site files from disk. This action
          cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}
