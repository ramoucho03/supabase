import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardFooter,
  CriticalIcon,
  Form,
  FormControl,
  FormField,
  Input,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { Input as CopyInput } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import AlertError from '@/components/ui/AlertError'
import { useSiteDeleteMutation } from '@/data/sites/site-delete-mutation'
import { useSiteQuery } from '@/data/sites/site-query'
import { useSiteUpdateMutation } from '@/data/sites/site-update-mutation'
import type { SiteTlsMode } from '@/lib/api/self-hosted/hosting/types'
import { DEFAULT_SFTP_PORT, TLS_OPTIONS } from './Sites.constants'

const FormSchema = z.object({
  domain: z
    .string()
    .min(1, 'A domain is required')
    .regex(/^[a-zA-Z0-9.-]+$/, 'Enter a valid host name, e.g. app.example.com'),
  tls: z.enum(['off', 'acme', 'byo']),
  spaFallback: z.boolean(),
  apiProxy: z.boolean(),
})

type FormValues = z.infer<typeof FormSchema>

export const SiteSettings = () => {
  const router = useRouter()
  const { ref, slug } = useParams()

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: site, isPending, isError, error } = useSiteQuery({ projectRef: ref, slug })

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { domain: '', tls: 'off', spaFallback: true, apiProxy: false },
  })

  const { mutate: updateSite, isPending: isUpdating } = useSiteUpdateMutation({
    onSuccess: () => {
      toast.success('Site settings saved')
      form.reset(form.getValues())
    },
  })

  const { mutate: deleteSite, isPending: isDeleting } = useSiteDeleteMutation({
    onSuccess: () => {
      toast.success(`Site “${slug}” deleted`)
      router.push(`/project/${ref}/sites`)
    },
  })

  useEffect(() => {
    if (site) {
      form.reset({
        domain: site.domain,
        tls: site.tls,
        spaFallback: site.spaFallback,
        apiProxy: site.apiProxy,
      })
    }
  }, [site])

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (!ref || !slug) return
    updateSite({ projectRef: ref, slug, ...values })
  }

  if (isPending) {
    return (
      <PageContainer size="default">
        <PageSection>
          <PageSectionContent>
            <GenericSkeletonLoader />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    )
  }

  if (isError) {
    return (
      <PageContainer size="default">
        <PageSection>
          <PageSectionContent>
            <AlertError error={error} subject="Failed to load site" />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    )
  }

  const isDirty = form.formState.isDirty

  return (
    <PageContainer size="default">
      {/* General settings */}
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>General</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardContent>
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Slug"
                    description="The internal identifier. Cannot be changed."
                  >
                    <Input value={slug ?? ''} disabled className="w-64" />
                  </FormItemLayout>
                </CardContent>

                <CardContent>
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Domain"
                        description="The host name visitors use to reach this site."
                      >
                        <FormControl>
                          <Input {...field} className="w-64" autoComplete="off" />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                <CardContent>
                  <FormField
                    control={form.control}
                    name="tls"
                    render={({ field }) => (
                      <FormItemLayout layout="vertical" label="TLS">
                        <FormControl>
                          <RadioGroupStacked
                            value={field.value}
                            onValueChange={(value: SiteTlsMode) => field.onChange(value)}
                          >
                            {TLS_OPTIONS.map((option) => (
                              <RadioGroupStackedItem
                                key={option.value}
                                value={option.value}
                                id={`tls-${option.value}`}
                                label={option.label}
                                description={option.description}
                              />
                            ))}
                          </RadioGroupStacked>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                <CardContent>
                  <FormField
                    control={form.control}
                    name="spaFallback"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Single-page app routing"
                        description="Serve index.html for unknown routes so client-side routers work on refresh."
                      >
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                <CardContent>
                  <FormField
                    control={form.control}
                    name="apiProxy"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Proxy API to the backend"
                        description="Expose /rest, /auth, /storage and /functions on the same origin to avoid CORS."
                      >
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                <CardFooter className="flex justify-end gap-2">
                  {isDirty && (
                    <Button type="default" onClick={() => form.reset()} disabled={isUpdating}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    disabled={!isDirty}
                  >
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </PageSectionContent>
      </PageSection>

      {/* File transfer / SFTP */}
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>File transfer (SFTP)</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card className="p-6 space-y-4">
            <p className="text-sm text-foreground-light">
              You can also upload files over SFTP with any client (FileZilla, Cyberduck, the{' '}
              <code className="text-code-inline">sftp</code> CLI…). Point it at your server and the
              site's document root below.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-foreground-lighter">Host</label>
                <CopyInput copy readOnly value={site?.domain ?? ''} className="font-mono text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-foreground-lighter">Port</label>
                <CopyInput
                  copy
                  readOnly
                  value={String(DEFAULT_SFTP_PORT)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-foreground-lighter">Document root</label>
                <CopyInput
                  copy
                  readOnly
                  value={site?.docroot ?? slug ?? ''}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <Admonition
              type="default"
              title="Credentials are configured on the server"
              description="SFTP users are defined in volumes/sftp/users.conf. In-dashboard credential management is coming in a later release."
            />
          </Card>
        </PageSectionContent>
      </PageSection>

      {/* Danger zone */}
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Delete site</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Alert variant="destructive">
            <CriticalIcon />
            <AlertTitle>Deleting a site cannot be undone</AlertTitle>
            <AlertDescription>
              This removes the nginx server block and permanently deletes all deployed files from
              disk.
            </AlertDescription>
            <AlertDescription className="mt-3">
              <Button type="danger" onClick={() => setShowDeleteModal(true)}>
                Delete this site
              </Button>
            </AlertDescription>
          </Alert>
        </PageSectionContent>
      </PageSection>

      <ConfirmationModal
        variant="destructive"
        visible={showDeleteModal}
        loading={isDeleting}
        title={`Delete site “${slug}”`}
        confirmLabel="Delete site"
        confirmLabelLoading="Deleting"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          if (ref && slug) deleteSite({ projectRef: ref, slug })
        }}
        alert={{
          base: { variant: 'destructive' },
          title: 'This action cannot be undone',
          description: 'All deployed files for this site will be permanently removed.',
        }}
      >
        <p className="text-sm text-foreground-light">
          Type the site domain into your records if you need to recreate it later — there is no
          backup.
        </p>
      </ConfirmationModal>
    </PageContainer>
  )
}
