import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError, UseCustomMutationOptions } from '@/types'
import { sitesApiFetch } from './sites-fetch'
import { sitesKeys } from './keys'

export type SiteFileSaveVariables = {
  projectRef: string
  slug: string
  path: string
  content: string
}

export type SiteFileSaveResponse = { path: string }

export async function saveSiteFile({ projectRef, slug, path, content }: SiteFileSaveVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')
  if (!path) throw new Error('path is required')
  return sitesApiFetch<SiteFileSaveResponse>(`/v1/projects/${projectRef}/sites/${slug}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content }),
  })
}

export const useSiteFileSaveMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SiteFileSaveResponse, ResponseError, SiteFileSaveVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SiteFileSaveResponse, ResponseError, SiteFileSaveVariables>({
    mutationFn: (vars) => saveSiteFile(vars),
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: sitesKeys.files(variables.projectRef, variables.slug),
        }),
        queryClient.invalidateQueries({
          queryKey: sitesKeys.fileContent(variables.projectRef, variables.slug, variables.path),
        }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) toast.error(`Failed to save file: ${data.message}`)
      else onError(data, variables, context)
    },
    ...options,
  })
}
