import { useQuery } from '@tanstack/react-query'

import type { ResponseError, UseCustomQueryOptions } from '@/types'
import { sitesApiFetch } from './sites-fetch'
import { sitesKeys } from './keys'

export type SiteFileContentVariables = {
  projectRef?: string
  slug?: string
  path?: string
}
export type SiteFileContentData = { path: string; content: string }
export type SiteFileContentError = ResponseError

export async function getSiteFileContent({ projectRef, slug, path }: SiteFileContentVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')
  if (!path) throw new Error('path is required')
  return sitesApiFetch<SiteFileContentData>(
    `/v1/projects/${projectRef}/sites/${slug}/files?path=${encodeURIComponent(path)}`
  )
}

export const useSiteFileContentQuery = <TData = SiteFileContentData>(
  { projectRef, slug, path }: SiteFileContentVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<SiteFileContentData, SiteFileContentError, TData> = {}
) =>
  useQuery<SiteFileContentData, SiteFileContentError, TData>({
    queryKey: sitesKeys.fileContent(projectRef, slug, path),
    queryFn: () => getSiteFileContent({ projectRef, slug, path }),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof slug !== 'undefined' &&
      typeof path !== 'undefined',
    // File contents are fetched on demand; don't keep refetching in the background.
    refetchOnWindowFocus: false,
    staleTime: 0,
    ...options,
  })
