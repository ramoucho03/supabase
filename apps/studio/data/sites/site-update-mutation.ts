import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Site, SiteTlsMode } from '@/lib/api/self-hosted/hosting/types'
import type { ResponseError, UseCustomMutationOptions } from '@/types'
import { sitesApiFetch } from './sites-fetch'
import { sitesKeys } from './keys'

export type SiteUpdateVariables = {
  projectRef: string
  slug: string
  domain?: string
  spaFallback?: boolean
  tls?: SiteTlsMode
  apiProxy?: boolean
}

export type SiteUpdateResponse = Site & { agentApplied?: boolean; agentError?: string }

export async function updateSite({ projectRef, slug, ...body }: SiteUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')
  return sitesApiFetch<SiteUpdateResponse>(`/v1/projects/${projectRef}/sites/${slug}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export const useSiteUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SiteUpdateResponse, ResponseError, SiteUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SiteUpdateResponse, ResponseError, SiteUpdateVariables>({
    mutationFn: (vars) => updateSite(vars),
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sitesKeys.list(variables.projectRef) }),
        queryClient.invalidateQueries({
          queryKey: sitesKeys.detail(variables.projectRef, variables.slug),
        }),
      ])
      // Surface a warning when the registry was updated but nginx wasn't reloaded.
      if (data?.agentApplied === false) {
        toast.warning(
          `Settings saved, but nginx wasn't updated: ${data.agentError ?? 'hosting agent unavailable'}`
        )
      }
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) toast.error(`Failed to update site: ${data.message}`)
      else onError(data, variables, context)
    },
    ...options,
  })
}
