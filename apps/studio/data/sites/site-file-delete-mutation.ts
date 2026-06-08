import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError, UseCustomMutationOptions } from '@/types'
import { sitesApiFetch } from './sites-fetch'
import { sitesKeys } from './keys'

export type SiteFileDeleteVariables = {
  projectRef: string
  slug: string
  path: string
}

export async function deleteSiteFile({ projectRef, slug, path }: SiteFileDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')
  if (!path) throw new Error('path is required')
  return sitesApiFetch(
    `/v1/projects/${projectRef}/sites/${encodeURIComponent(slug)}/files?path=${encodeURIComponent(path)}`,
    { method: 'DELETE' }
  )
}

export const useSiteFileDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<unknown, ResponseError, SiteFileDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<unknown, ResponseError, SiteFileDeleteVariables>({
    mutationFn: (vars) => deleteSiteFile(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: sitesKeys.files(variables.projectRef, variables.slug),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) toast.error(`Failed to delete file: ${data.message}`)
      else onError(data, variables, context)
    },
    ...options,
  })
}
