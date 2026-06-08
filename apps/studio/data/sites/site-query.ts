import { useQuery } from '@tanstack/react-query'

import type { Site } from '@/lib/api/self-hosted/hosting/types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'
import { sitesApiFetch } from './sites-fetch'
import { sitesKeys } from './keys'

export type SiteVariables = { projectRef?: string; slug?: string }
export type SiteData = Site
export type SiteError = ResponseError

export async function getSite({ projectRef, slug }: SiteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')
  return sitesApiFetch<Site>(`/v1/projects/${projectRef}/sites/${slug}`)
}

export const useSiteQuery = <TData = SiteData>(
  { projectRef, slug }: SiteVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<SiteData, SiteError, TData> = {}
) =>
  useQuery<SiteData, SiteError, TData>({
    queryKey: sitesKeys.detail(projectRef, slug),
    queryFn: () => getSite({ projectRef, slug }),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof slug !== 'undefined',
    ...options,
  })
